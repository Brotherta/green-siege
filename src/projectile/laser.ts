import * as BABYLON from 'babylonjs';
import { Targetable } from '../target/targetable';
import { Projectile } from './projectile';

export class Laser implements Projectile {
    private _scene: BABYLON.Scene;
    private _laserModel: BABYLON.Mesh;
    private _laserSpeed: number;
    private _dispowerDistance: number;
    private _collisionDistance: number;
    private _collisionPresicion: number;

    public constructor(scene: BABYLON.Scene, speed: number = 70, dispowerDistance: number = 80, collisionDistance: number = 40, collisionPresicion: number = 5) {
        this._scene = scene;
        this._laserSpeed = speed;
        this._dispowerDistance = dispowerDistance;
        this._collisionDistance = collisionDistance;
        this._collisionPresicion = collisionPresicion;
        this._laserModel = this.initLaserModel();
        this._laserModel.metadata = { parentClass: this };
    }

    private initLaserModel(): BABYLON.Mesh {
        const model = BABYLON.MeshBuilder.CreateCylinder(
            'laser',
            {
                height: 0.1,
                diameter: 0.1,
            },
            this._scene
        );

        const material = new BABYLON.StandardMaterial('red', this._scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        model.material = material;
        model.isVisible = false;

        return model;
    }

    public get laserModel(): BABYLON.Mesh {
        return this._laserModel;
    }

    private getDistanceWithPlayer(laser: BABYLON.InstancedMesh): number {
        return BABYLON.Vector3.Distance(laser.position, this._scene.getCameraById('PlayerCamera').position);
    }

    public fire(origin: BABYLON.Mesh): void {
        const laserInstance = this._laserModel.createInstance('laserInstance');
        laserInstance.position = origin.getAbsolutePosition().clone();
        laserInstance.rotationQuaternion = origin.absoluteRotationQuaternion.clone();
        laserInstance.rotationQuaternion = laserInstance.rotationQuaternion.multiply(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, -Math.PI / 2));

        laserInstance.isVisible = true;
    }

    public fireDirection(origin: BABYLON.Mesh, direction: BABYLON.Vector3): void {
        const laserInstance = this._laserModel.createInstance('laserInstance');
        laserInstance.position = origin.getAbsolutePosition().clone();
        laserInstance.lookAt(direction);

        // Rotate the laser instance to make its forward direction become its up direction
        laserInstance.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);

        laserInstance.isVisible = true;
    }

    private getAllLaserInstances(): BABYLON.InstancedMesh[] {
        return this._laserModel.instances;
    }

    private checkCollision(laser: BABYLON.InstancedMesh, deltaTime: number): void {
        const steps = 1; // The number of intermediaate collision checks
        const stepDistance = (this._laserSpeed * deltaTime) / steps;

        for (let i = 0; i < steps; i++) {
            const newPosition = laser.position.add(laser.up.scale(stepDistance * i));
            const ray = new BABYLON.Ray(newPosition, laser.up, stepDistance);
            const hit = this._scene.pickWithRay(ray);

            if (hit.pickedMesh && hit.pickedMesh.metadata && hit.pickedMesh.metadata.parentClass instanceof Targetable) {
                hit.pickedMesh.metadata.parentClass.touch();
                laser.dispose();
                break;
            }

            // Dispose if the laser hits something
            if (hit.pickedMesh && hit.pickedMesh.name !== 'laserInstance') {
                laser.dispose();
                break;
            }
        }
    }

    public animate(deltaTime: number): void {
        this.getAllLaserInstances().forEach((laser) => {
            var distance = this._laserSpeed * deltaTime;
            laser.position.addInPlace(laser.up.scale(distance));
            const laserDistance = this.getDistanceWithPlayer(laser);

            // Dispose if the laser is too far away from the player
            if (laserDistance > this._dispowerDistance) {
                laser.dispose();
            }

            // Check collision if the laser is close enough to the player
            if (laserDistance < this._collisionDistance) {
                this.checkCollision(laser, deltaTime);
            }
        }, this);
    }

    public dispose(): void {
        this.getAllLaserInstances().forEach((laser) => {
            laser.dispose();
        }, this);

        this._laserModel.dispose();
    }
}
