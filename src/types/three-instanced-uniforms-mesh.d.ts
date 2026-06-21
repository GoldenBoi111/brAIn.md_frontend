declare module "three-instanced-uniforms-mesh" {
  import { InstancedMesh, Material, BufferGeometry } from "three";

  export class InstancedUniformsMesh extends InstancedMesh {
    constructor(geometry: BufferGeometry, material: Material, count: number);
    setUniformAt(name: string, index: number, value: unknown): void;
  }
}
