import { Vector2 } from './vec';

export class Zone {
    _pos: Vector2;
    _owner: string;
    _troops: number;

    constructor(pos: Vector2, owner: string, troops: number) {
        this._pos = pos;
        this._owner = owner;
        this._troops = troops;
    }
}

export class Board {}
