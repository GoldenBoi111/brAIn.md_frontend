"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import {
  Box3,
  Color,
  Group,
  LoadingManager,
  MathUtils,
  Line,
  LineBasicMaterial,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  InstancedBufferAttribute,
  Vector2,
  Vector3,
  WebGLRenderer,
  BufferGeometry,
  SphereGeometry,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";

const VERTEX_SHADER = `
attribute float instanceOpacity;
uniform vec3 uPointer;
uniform vec3 uColor;
uniform float uRotation;
uniform float uSize;
uniform float uHover;

varying vec3 vColor;
varying float vOpacity;

#define PI 3.14159265359

mat2 rotate(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  vec4 mvPosition = vec4(position, 1.0);
  mvPosition = instanceMatrix * mvPosition;

  float d = distance(uPointer, mvPosition.xyz);
  float c = smoothstep(0.45, 0.1, d);

  float scale = uSize + c * 8.0 * uHover;
  vec3 pos = position;
  pos *= scale;
  pos.xz *= rotate(PI * c * uRotation + PI * uRotation * 0.43);
  pos.xy *= rotate(PI * c * uRotation + PI * uRotation * 0.71);

  mvPosition = instanceMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
  vColor = uColor;
  vOpacity = instanceOpacity;
}
`;

const FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vOpacity;

void main() {
  gl_FragColor = vec4(vColor, vOpacity);
}
`;

const NODE_VERTEX_SHADER = `
attribute float instanceOpacity;
uniform vec3 uColor;

varying vec3 vColor;
varying float vOpacity;

void main() {
  vColor = uColor;
  vOpacity = instanceOpacity;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;

const NODE_FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vOpacity;

void main() {
  gl_FragColor = vec4(vColor, vOpacity);
}
`;

const BRAIN_MODEL_URL = "/brain.glb";

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export interface BrainGraphNode {
  id: string;
  title: string;
  accent: string;
}

export interface BrainGraphLink {
  id: string;
  source: string;
  target: string;
  relation: string;
}

interface BrainAnimationProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  autoAnimate?: boolean;
  graphNodes?: BrainGraphNode[];
  graphLinks?: BrainGraphLink[];
  activeNodeId?: string | null;
  hideUnconnectedNodes?: boolean;
  onNodeHover?: (id: string | null) => void;
  onNodeSelect?: (id: string) => void;
}

export const BrainAnimation = memo(function BrainAnimation({
  interactive = true,
  autoAnimate = true,
  graphNodes = [],
  graphLinks = [],
  activeNodeId = null,
  hideUnconnectedNodes = false,
  onNodeHover,
  onNodeSelect,
  className,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onWheel,
  ...props
}: BrainAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const loadingManagerRef = useRef<LoadingManager | null>(null);
  const loaderRef = useRef<GLTFLoader | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerNdcRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef(new Vector3(-0.25, 0.65, 0.08));
  const hoveredNodeRef = useRef<string | null>(null);
  const cameraDistanceRef = useRef(3);
  const cameraBoundsRef = useRef({ min: 1, max: 8 });
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const threeRef = useRef({
    scene: null as Scene | null,
    camera: null as PerspectiveCamera | null,
    raycaster: null as Raycaster | null,
    renderer: null as WebGLRenderer | null,
    graphGroup: null as Group | null,
    brainMesh: null as InstancedUniformsMesh | null,
    nodeMesh: null as InstancedUniformsMesh | null,
    linkGroup: null as Group | null,
    nodeLookup: new Map<string, number>(),
    nodeVertexIndices: new Set<number>(),
    nodePositions: new Map<string, Vector3>(),
    linkMaterials: [] as LineBasicMaterial[],
  });

  const colors = useMemo(() => {
    const palette = isDarkTheme
      ? ["#44af69", "#f8333c", "#fcab10", "#2b9eb3", "#dbd5b5"]
      : ["#220901", "#621708", "#941b0c", "#bc3908", "#f6aa1c"];

    return palette.map((value) => new Color(value));
  }, [isDarkTheme]);

  const graphNodesPropRef = useRef(graphNodes);
  const graphLinksPropRef = useRef(graphLinks);
  const activeNodeIdPropRef = useRef<string | null>(activeNodeId);

  const uniformsRef = useRef({
    uHover: 0,
  });

  const applySize = useCallback(() => {
    const container = containerRef.current;
    const renderer = threeRef.current.renderer;
    const camera = threeRef.current.camera;

    if (!container || !renderer || !camera) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    camera.position.z = cameraDistanceRef.current;
  }, []);

  const render = useCallback(() => {
    const renderer = threeRef.current.renderer;
    const scene = threeRef.current.scene;
    const camera = threeRef.current.camera;

    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
  }, []);

  const syncGraphVisuals = useCallback(() => {
    const nodeMesh = threeRef.current.nodeMesh;
    const brainMesh = threeRef.current.brainMesh;
    const linkMaterials = threeRef.current.linkMaterials;
    const nodePositions = threeRef.current.nodePositions;
    const nodeVertexIndices = threeRef.current.nodeVertexIndices;
    const graphNodes = graphNodesPropRef.current;
    const graphLinks = graphLinksPropRef.current;
    const activeId = activeNodeIdPropRef.current;
    const shouldHideUnconnected = hideUnconnectedNodes && Boolean(activeId);

    if (!nodeMesh || graphNodes.length === 0) return;

    const connectedIds = new Set<string>();

    if (activeId) {
      for (const link of graphLinks) {
        if (link.source === activeId) connectedIds.add(link.target);
        if (link.target === activeId) connectedIds.add(link.source);
      }
    }

    const dummy = new Object3D();

    graphNodes.forEach((node, index) => {
      const position = nodePositions.get(node.id);
      if (!position) return;

      const isActive = node.id === activeId;
      const isConnected = connectedIds.has(node.id);
      const scale = isActive ? 3.2 : isConnected ? 1.9 : 1.05;

      dummy.position.copy(position);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(
        isActive ? 0.4 : 0.12,
        isConnected ? 0.5 : 0.2,
        isConnected ? 0.24 : 0.12,
      );
      dummy.updateMatrix();
    nodeMesh.setMatrixAt(index, dummy.matrix);
    nodeMesh.setUniformAt("uColor", index, new Color(isActive ? node.accent : isConnected ? node.accent : 0xd6d3d1));
      const nodeOpacityAttr = nodeMesh.geometry.getAttribute("instanceOpacity") as InstancedBufferAttribute | undefined;
      if (nodeOpacityAttr) {
      nodeOpacityAttr.setX(index, isActive || isConnected ? 0.98 : activeId ? 0.78 : 0.86);
      }
    });

    nodeMesh.instanceMatrix.needsUpdate = true;
    const nodeOpacityAttr = nodeMesh.geometry.getAttribute("instanceOpacity") as InstancedBufferAttribute | undefined;
    if (nodeOpacityAttr) {
      nodeOpacityAttr.needsUpdate = true;
    }

    if (brainMesh) {
      const brainOpacityAttr = brainMesh.geometry.getAttribute("instanceOpacity") as InstancedBufferAttribute | undefined;
      if (brainOpacityAttr) {
        const dimOpacity = activeId ? 0.18 : 0.86;
        for (let index = 0; index < brainOpacityAttr.count; index += 1) {
          const isDocumentVertex = nodeVertexIndices.has(index);
          if (shouldHideUnconnected && !isDocumentVertex) {
            brainOpacityAttr.setX(index, 0);
            continue;
          }

          brainOpacityAttr.setX(index, isDocumentVertex ? dimOpacity : activeId ? 0.06 : 0.86);
        }
        brainOpacityAttr.needsUpdate = true;
      }
    }

    linkMaterials.forEach((material, index) => {
      const link = graphLinks[index];
      const isActive = Boolean(
        activeId && (link.source === activeId || link.target === activeId),
      );
      material.color.set(isActive ? (isDarkTheme ? "#2b9eb3" : "#bc3908") : activeId ? (isDarkTheme ? "#dbd5b5" : "#f6aa1c") : "#d6d3d1");
      material.opacity = isActive ? 0.72 : activeId ? 0.12 : 0.22;
    });
  }, [hideUnconnectedNodes, isDarkTheme]);

  const syncRotation = useCallback(() => {
    const graphGroup = threeRef.current.graphGroup;
    if (!graphGroup) return;

    graphGroup.rotation.set(rotationRef.current.x, rotationRef.current.y, rotationRef.current.z);
  }, []);

  const loadModel = useCallback(() => {
    return new Promise<void>((resolve) => {
        const loader = loaderRef.current;
      const scene = threeRef.current.scene;

      if (!loader || !scene) {
        resolve();
        return;
      }

      loader.load(BRAIN_MODEL_URL, (gltf) => {
        const brainMesh = gltf.scene.children[0] as Mesh;
        const graphGroup = new Group();
        const linkGroup = new Group();
        const geometry = new SphereGeometry(0.004, 8, 8);
        const material = new ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          transparent: true,
          depthWrite: false,
          uniforms: {
            uPointer: { value: new Vector3() },
            uColor: { value: new Color() },
            uRotation: { value: 0 },
            uSize: { value: 0 },
            uHover: { value: uniformsRef.current.uHover },
          },
        });

        graphGroup.add(linkGroup);
        scene.add(graphGroup);
        threeRef.current.graphGroup = graphGroup;
        threeRef.current.linkGroup = linkGroup;

        if (brainMesh.geometry instanceof BufferGeometry) {
          const positions = brainMesh.geometry.attributes.position.array as ArrayLike<number>;
          const count = brainMesh.geometry.attributes.position.count;
          const instancedMesh = new InstancedUniformsMesh(geometry, material, count);

          threeRef.current.brainMesh = instancedMesh;
          graphGroup.add(instancedMesh);

          const dummy = new Object3D();

          for (let i = 0; i < positions.length; i += 3) {
            dummy.position.set(positions[i + 0], positions[i + 1], positions[i + 2]);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i / 3, dummy.matrix);
            instancedMesh.setUniformAt("uRotation", i / 3, MathUtils.randFloat(-1, 1));
            instancedMesh.setUniformAt("uSize", i / 3, MathUtils.randFloat(0.3, 3));
            instancedMesh.setUniformAt("uColor", i / 3, colors[MathUtils.randInt(0, colors.length - 1)]);
          }

          const graphNodesNow = graphNodesPropRef.current;
          const graphLinksNow = graphLinksPropRef.current;
          const nodePositions = new Map<string, Vector3>();
          const usedIndices = new Set<number>();
          const vertexCount = count;

          graphNodesNow.forEach((node) => {
            const baseHash = Math.abs(hashString(node.id));
            const stride = Math.max(1, Math.floor(vertexCount / Math.max(1, graphNodesNow.length)));
            let candidate = baseHash % vertexCount;
            while (usedIndices.has(candidate)) {
              candidate = (candidate + stride) % vertexCount;
            }

            usedIndices.add(candidate);
            threeRef.current.nodeLookup.set(node.id, candidate);
            threeRef.current.nodeVertexIndices.add(candidate);

            const position = new Vector3(
              positions[candidate * 3 + 0],
              positions[candidate * 3 + 1],
              positions[candidate * 3 + 2],
            );

            nodePositions.set(node.id, position);
          });

          threeRef.current.nodePositions = nodePositions;
          threeRef.current.nodeVertexIndices = usedIndices;

          const brainOpacityAttr = new InstancedBufferAttribute(new Float32Array(count), 1);
          instancedMesh.geometry.setAttribute("instanceOpacity", brainOpacityAttr);

          if (graphNodesNow.length > 0) {
            const nodeGeometry = new SphereGeometry(0.006, 14, 14);
            const nodeMaterial = new ShaderMaterial({
              vertexShader: NODE_VERTEX_SHADER,
              fragmentShader: NODE_FRAGMENT_SHADER,
              transparent: true,
              depthWrite: false,
              alphaTest: 0.01,
              uniforms: {
                uColor: { value: new Color() },
              },
            });
            const nodeMesh = new InstancedUniformsMesh(nodeGeometry, nodeMaterial, graphNodesNow.length);
            nodeMesh.frustumCulled = false;
            graphGroup.add(nodeMesh);
            threeRef.current.nodeMesh = nodeMesh;

            const nodeOpacityAttr = new InstancedBufferAttribute(new Float32Array(graphNodesNow.length), 1);
            nodeMesh.geometry.setAttribute("instanceOpacity", nodeOpacityAttr);

            graphNodesNow.forEach((node, index) => {
              const position = nodePositions.get(node.id);
              if (!position) return;

              dummy.position.copy(position);
              dummy.scale.setScalar(1.05);
              dummy.rotation.set(0.1, 0.2, 0.05);
              dummy.updateMatrix();
              nodeMesh.setMatrixAt(index, dummy.matrix);
              nodeMesh.setUniformAt("uColor", index, new Color(node.accent));
              nodeOpacityAttr.setX(index, 0.95);
            });
            nodeMesh.instanceMatrix.needsUpdate = true;
            nodeOpacityAttr.needsUpdate = true;
          }

          const linkMaterials: LineBasicMaterial[] = [];
          graphLinksNow.forEach((link) => {
            const source = nodePositions.get(link.source);
            const target = nodePositions.get(link.target);
            if (!source || !target) return;

            const geometry = new BufferGeometry().setFromPoints([source, target]);
            const lineMaterial = new LineBasicMaterial({
              color: "#d8d8d8",
              transparent: true,
              opacity: 0.22,
            });
            const line = new Line(geometry, lineMaterial);
            linkGroup.add(line);
            linkMaterials.push(lineMaterial);
          });

          threeRef.current.linkMaterials = linkMaterials;

          const frameBounds = new Box3().setFromObject(graphGroup);
          const frameSize = new Vector3();
          const frameCenter = new Vector3();
          frameBounds.getSize(frameSize);
          frameBounds.getCenter(frameCenter);

          graphGroup.position.sub(frameCenter);

          const maxDimension = Math.max(frameSize.x, frameSize.y, frameSize.z);
          const sceneCamera = threeRef.current.camera;
          if (sceneCamera) {
            const fitDistance =
              maxDimension / (2 * Math.tan(MathUtils.degToRad(sceneCamera.fov) / 2));
            cameraBoundsRef.current = {
              min: fitDistance * 0.55,
              max: fitDistance * 2.4,
            };
            cameraDistanceRef.current = window.innerWidth < 767 ? fitDistance * 1.25 : fitDistance * 1.05;

            sceneCamera.near = Math.max(0.01, cameraDistanceRef.current / 100);
            sceneCamera.far = cameraDistanceRef.current * 100;
            sceneCamera.position.set(0, 0, cameraDistanceRef.current);
            sceneCamera.lookAt(0, 0, 0);
            sceneCamera.updateProjectionMatrix();
          }

          if (threeRef.current.nodeMesh) {
            syncGraphVisuals();
          }
          syncRotation();
        }

        render();
        resolve();
      });
    });
  }, [colors, render, syncGraphVisuals, syncRotation]);

  const animate = useCallback(() => {
    if (!initializedRef.current) return;

    render();
    rafRef.current = window.requestAnimationFrame(animate);
  }, [render]);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDarkTheme(root.classList.contains("dark"));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    graphNodesPropRef.current = graphNodes;
    graphLinksPropRef.current = graphLinks;
    activeNodeIdPropRef.current = activeNodeId;
    syncGraphVisuals();
    render();
  }, [activeNodeId, graphLinks, graphNodes, render, syncGraphVisuals]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || initializedRef.current) return;

    const three = threeRef.current;
    initializedRef.current = true;
    three.scene = new Scene();
    three.camera = new PerspectiveCamera(75, 1, 0.1, 100);
    three.raycaster = new Raycaster();
    three.camera.position.set(0, 0, cameraDistanceRef.current);
    three.renderer = new WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio === 1,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    three.renderer.setClearColor(0x000000, 0);
    three.renderer.domElement.style.position = "absolute";
    three.renderer.domElement.style.inset = "0";
    three.renderer.domElement.style.display = "block";
    three.renderer.domElement.style.width = "100%";
    three.renderer.domElement.style.height = "100%";

    container.appendChild(three.renderer.domElement);

    loadingManagerRef.current = new LoadingManager();
    loaderRef.current = new GLTFLoader(loadingManagerRef.current);

    const onResize = () => {
      applySize();
      render();
    };

    window.addEventListener("resize", onResize, { passive: true });

    resizeObserverRef.current = new ResizeObserver(() => {
      applySize();
      render();
    });
    resizeObserverRef.current.observe(container);

    applySize();

    loadModel().then(() => {
      if (autoAnimate) {
        animate();
      } else {
        render();
      }
    });

    return () => {
      initializedRef.current = false;

      window.removeEventListener("resize", onResize);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const renderer = three.renderer;
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }

      three.scene = null;
      three.camera = null;
      three.raycaster = null;
      three.renderer = null;
      three.graphGroup = null;
      three.brainMesh = null;
      three.nodeMesh = null;
      three.linkGroup = null;
      three.nodeLookup = new Map();
      three.nodeVertexIndices = new Set();
      three.nodePositions = new Map();
      three.linkMaterials = [];
      loaderRef.current = null;
      loadingManagerRef.current = null;
    };
  }, [animate, applySize, autoAnimate, loadModel, render]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);

      if (!interactive) return;

      const container = containerRef.current;
      if (!container) return;

      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      container.setPointerCapture(event.pointerId);
    },
    [interactive, onPointerDown],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);

      const container = containerRef.current;
      const camera = threeRef.current.camera;
      const raycaster = threeRef.current.raycaster;
      const nodeMesh = threeRef.current.nodeMesh;

      if (!container || !camera) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointerNdcRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdcRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (!interactive || !isDraggingRef.current) {
        if (!raycaster || !nodeMesh) return;

        raycaster.setFromCamera(pointerNdcRef.current as unknown as Vector2, camera);
        const intersections = raycaster.intersectObject(nodeMesh);
        const nextHoveredId = intersections.length > 0 && intersections[0].instanceId !== undefined
          ? graphNodesPropRef.current[intersections[0].instanceId]?.id ?? null
          : null;

        if (hoveredNodeRef.current !== nextHoveredId) {
          hoveredNodeRef.current = nextHoveredId;
          onNodeHover?.(nextHoveredId);
        }

        container.style.cursor = nextHoveredId ? "pointer" : "grab";

        return;
      }

      const dx = event.clientX - pointerRef.current.x;
      const dy = event.clientY - pointerRef.current.y;
      if (!hasDraggedRef.current && Math.hypot(dx, dy) > 4) {
        hasDraggedRef.current = true;
      }
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;

      rotationRef.current.y += dx * 0.008;
      rotationRef.current.x = MathUtils.clamp(rotationRef.current.x + dy * 0.008, -1.15, 1.15);
      syncRotation();
      render();
      container.style.cursor = "grabbing";
    },
    [interactive, onPointerMove, onNodeHover, render, syncRotation],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      onPointerUp?.(event);

      if (!interactive) return;

      isDraggingRef.current = false;

      const camera = threeRef.current.camera;
      const raycaster = threeRef.current.raycaster;
      const nodeMesh = threeRef.current.nodeMesh;

      if (camera && raycaster && nodeMesh) {
        raycaster.setFromCamera(pointerNdcRef.current as unknown as Vector2, camera);
        const intersections = raycaster.intersectObject(nodeMesh);
        const nextSelectedId = intersections.length > 0 && intersections[0].instanceId !== undefined
          ? graphNodesPropRef.current[intersections[0].instanceId]?.id ?? null
          : null;

        if (nextSelectedId && !hasDraggedRef.current) {
          hoveredNodeRef.current = nextSelectedId;
          onNodeSelect?.(nextSelectedId);
        }
      }

      const container = containerRef.current;
      if (container && container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }

      if (container) {
        container.style.cursor = hoveredNodeRef.current ? "pointer" : "grab";
      }
    },
    [interactive, onNodeSelect, onPointerUp],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      onPointerCancel?.(event);
      isDraggingRef.current = false;
    },
    [onPointerCancel],
  );

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      if (!isDraggingRef.current && hoveredNodeRef.current) {
        hoveredNodeRef.current = null;
        onNodeHover?.(null);
      }

      const container = containerRef.current;
      if (container) {
        container.style.cursor = "grab";
      }
    },
    [onNodeHover, onPointerLeave],
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      onWheel?.(event);

      if (!interactive) return;

      event.preventDefault();

      const camera = threeRef.current.camera;
      if (!camera) return;

      const { min, max } = cameraBoundsRef.current;
      const zoomFactor = Math.exp(event.deltaY * 0.00125);
      cameraDistanceRef.current = MathUtils.clamp(cameraDistanceRef.current * zoomFactor, min, max);
      camera.position.z = cameraDistanceRef.current;
      camera.updateProjectionMatrix();
      render();
    },
    [interactive, onWheel, render],
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ cursor: interactive ? "grab" : "default", touchAction: "none", ...style }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
      {...props}
    />
  );
});

export default BrainAnimation;
