import { Aquanore } from "aquanore";
import { Color, Polygon, Renderer, Sprite, Texture } from "aquanore/graphics";
import { Vector2 } from "aquanore/math";
import { Cursor, Keyboard } from "aquanore/input";

export class Game {
    private static _texTileset: Texture;
    private static _texBackground: Texture;
    private static _polyTileset: Polygon;
    private static _polyBackground: Polygon;
    private static _polyPixel: Polygon;

    private static _frameWidth: number;
    private static _frameHeight: number;
    private static _scale: number;

    public static async init() {
        this._frameWidth = 16;
        this._frameHeight = 16;
        this._scale = 1;

        await this.initEvents();
        await this.initBackground();
        await this.initPixel();

        await this.resize();
    }

    private static async initBackground() {
        const cnv = document.createElement("canvas");
        cnv.width = 64;
        cnv.height = 64;

        const ctx = cnv.getContext("2d")!;

        // Generate checkers pattern
        for (let x = 0; x < cnv.width; x++) {
            for (let y = 0; y < cnv.height; y++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = "#ccc";
                    ctx.fillRect(x, y, 1, 1);
                } else {
                    ctx.fillStyle = "#888";
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Generate texture object
        const data = ctx.getImageData(0, 0, cnv.width, cnv.height);
        this._texBackground = new Texture(cnv.width, cnv.height, data);

        // Generate polygon object
        this._polyBackground = Polygon.rectangle(cnv.width, cnv.height);
    }

    private static async initPixel() {
        this._polyPixel = Polygon.rectangle(1, 1);
    }

    private static async initEvents() {
        const btnLoadDisk = document.querySelector("#btn-load-disk") as HTMLButtonElement;

        btnLoadDisk.onclick = async () => {
            await this.onLoadDisk();
        }
    }

    public static async update() {
        await this.updateInput();
    }

    private static async updateInput() {
        const elScale = document.querySelector("#input-scale") as HTMLInputElement;

        if (elScale) {
            this._scale = parseInt(elScale.value);
        }

        if (Cursor.wheelY > 0 && this._scale > 1) {
            this._scale--;
        }

        if (Cursor.wheelY < 0 && this._scale < 10) {
            this._scale++;
        }
    }

    public static async render() {
        await this.renderBackground();
        await this.renderSprite();
        await this.renderGrid();
    }

    private static async renderSprite() {
        if (!this._texTileset || !this._polyTileset) {
            return;
        }

        const pos = new Vector2(0, 0);
        const scale = new Vector2(this._scale, this._scale);
        const color = new Color(255, 255, 255, 255);
        const origin = new Vector2(0, 0);
        const offset = new Vector2(0, 0);

        Renderer.drawPolygon(this._polyTileset, pos, scale, origin, 0, color, this._texTileset, offset, false, false);
    }

    private static async renderBackground() {
        if (!this._polyBackground || !this._texBackground) {
            return;
        }

        const pos = new Vector2(0, 0);
        const scale = new Vector2(4 * this._scale, 4 * this._scale);
        const origin = new Vector2(0, 0);
        const color = new Color(255, 255, 255, 255);

        const hor = 10;
        const vert = 8;

        for (let x = 0; x < hor; x++) {
            for (let y = 0; y < vert; y++) {
                pos.x = x * this._texBackground.width * scale.x;
                pos.y = y * this._texBackground.height * scale.y;

                Renderer.drawPolygon(this._polyBackground, pos, scale, origin, 0, color, this._texBackground);
            }
        }
    }

    private static async renderGrid() {
        if (!this._polyPixel || !this._texTileset) {
            return;
        }

        const pos = new Vector2(0, 0);
        const scale = new Vector2(1, 1);
        const origin = new Vector2(0, 0);
        const color = new Color(0, 0, 0, 255);

        const hor = this._frameWidth;
        const vert = this._frameHeight;
        const maxHor = this._texTileset.width / hor + 1;
        const maxVert = this._texTileset.height / vert + 1;

        for (let x = 0; x < maxHor; x++) {
            pos.x = x * this._scale * hor;
            pos.y = 0;
            scale.x = 1;
            scale.y = this._texTileset.height * this._scale;

            Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, color);
        }

        for (let y = 0; y < maxVert; y++) {
            pos.x = 0;
            pos.y = y * this._scale * vert;
            scale.x = this._texTileset.width * this._scale;
            scale.y = 1;

            Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, color);
        }
    }

    public static async resize() {
        const parent = document.querySelector(".game") as HTMLDivElement;
        const cnv = Aquanore.canvas;

        cnv.width = parent.clientWidth;
        cnv.height = parent.clientHeight;
    }

    /* EVENTS */
    private static async onLoadDisk() {
        const el = document.createElement("input");
        el.type = "file";
        el.accept = "image/*";
        el.click();

        el.addEventListener("change", () => {
            const panel = document.querySelector("#load") as HTMLDivElement;

            if (panel) {
                panel.style.display = "none";
            }

            if (!el.files || el.files.length === 0) {
                return;
            }

            const img = new Image();
            img.src = URL.createObjectURL(el.files[0]);
            img.onload = async () => {
                this._texTileset = new Texture(img.width, img.height, img);
                this._polyTileset = Polygon.rectangle(img.width, img.height);
            };
        });
    }
}