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

    private static _viewX: number;
    private static _viewY: number;
    private static _cursorX: number;
    private static _cursorY: number;
    private static _cursorPrevX: number;
    private static _cursorPrevY: number;

    public static async init() {
        this._frameWidth = 16;
        this._frameHeight = 16;
        this._viewX = 0;
        this._viewY = 0;
        this._cursorX = 0;
        this._cursorPrevX = 0;
        this._cursorY = 0;
        this._cursorPrevY = 0;
        this._scale = 1;

        await this.initEvents();
        await this.initBackground();
        await this.initPixel();

        await this.resize();
        await this.load();
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
        await this.updateInfo();
        await this.updateInput();
        await this.updateCursor();
    }

    private static async updateInfo() {
        const elWidth = document.querySelector("#label-width") as HTMLSpanElement;
        const elHeight = document.querySelector("#label-height") as HTMLSpanElement;
        const elFramesHor = document.querySelector("#label-frames-hor") as HTMLSpanElement;
        const elFramesVert = document.querySelector("#label-frames-vert") as HTMLSpanElement;

        if (!this._texTileset) {
            return;
        }

        if (elWidth) {
            elWidth.innerHTML = `${this._texTileset.width}px`;
        }

        if (elHeight) {
            elHeight.innerHTML = `${this._texTileset.height}px`;
        }

        if (elFramesHor) {
            elFramesHor.innerHTML = `${Math.round(this._texTileset.width / this._frameWidth)}`;
        }

        if (elFramesVert) {
            elFramesVert.innerHTML = `${Math.round(this._texTileset.height / this._frameHeight)}`;
        }
    }

    private static async updateInput() {
        const elScale = document.querySelector("#input-scale") as HTMLInputElement;
        const elFrameWidth = document.querySelector("#input-frame-width") as HTMLInputElement;
        const elFrameHeight = document.querySelector("#input-frame-height") as HTMLInputElement;

        if (elScale) {
            const value = parseInt(elScale.value);
            const min = parseInt(elScale.min);
            const max = parseInt(elScale.max);

            if (!elScale.value) {
                return;
            }

            if (value < 1) {
                elScale.value = min.toString();
                return;
            }

            if (value > 10) {
                elScale.value = max.toString();
                return;
            }

            this._scale = value;
        }

        if (elFrameWidth) {
            const value = parseInt(elFrameWidth.value);
            const min = parseInt(elFrameWidth.min);
            const max = parseInt(elFrameWidth.max);

            if (!elFrameWidth.value) {
                return;
            }

            if (value < min) {
                elFrameWidth.value = min.toString();
                return;
            }

            if (value > max) {
                elFrameWidth.value = max.toString();
                return;
            }

            this._frameWidth = value;
        }

        if (elFrameHeight) {
            const value = parseInt(elFrameHeight.value);
            const min = parseInt(elFrameHeight.min);
            const max = parseInt(elFrameHeight.max);

            if (!elFrameHeight.value) {
                return;
            }

            if (value < min) {
                elFrameHeight.value = min.toString();
                return;
            }

            if (value > max) {
                elFrameHeight.value = max.toString();
                return;
            }

            this._frameHeight = value;
        }
    }

    private static async updateCursor() {
        this._cursorPrevX = this._cursorX;
        this._cursorPrevY = this._cursorY;
        this._cursorX = Cursor.x;
        this._cursorY = Cursor.y;

        if (Cursor.wheelY > 0 && this._scale > 1) {
            const elScale = document.querySelector("#input-scale") as HTMLInputElement;

            if (elScale) {
                let value = parseInt(elScale.value);
                value--;

                elScale.value = value.toString();
            }
        }

        if (Cursor.wheelY < 0 && this._scale < 10) {
            const elScale = document.querySelector("#input-scale") as HTMLInputElement;

            if (elScale) {
                let value = parseInt(elScale.value);
                value++;

                elScale.value = value.toString();
            }
        }

        if (Cursor.isButtonDown(1)) {
            const moveX = this._cursorX - this._cursorPrevX;
            const moveY = this._cursorY - this._cursorPrevY;

            this._viewX -= moveX;
            this._viewY -= moveY;
        }

        if (Cursor.isButtonPressed(2)) {
            this._viewX = 0;
            this._viewY = 0;
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

        const pos = new Vector2(-this._viewX, -this._viewY);
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

        const origin = new Vector2(0, 0);
        const color = new Color(0, 0, 0, 255);

        const hor = this._frameWidth;
        const vert = this._frameHeight;
        const maxHor = this._texTileset.width / hor + 1;
        const maxVert = this._texTileset.height / vert + 1;

        for (let x = 0; x < maxHor; x++) {
            const pos = new Vector2(-this._viewX, -this._viewY);
            pos.x += x * this._scale * hor;

            const scale = new Vector2(1, 1);
            scale.y = this._texTileset.height * this._scale;

            Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, color);
        }

        for (let y = 0; y < maxVert; y++) {
            const pos = new Vector2(-this._viewX, -this._viewY);
            pos.y += y * this._scale * vert;

            const scale = new Vector2(1, 1);
            scale.x = this._texTileset.width * this._scale;

            Renderer.drawPolygon(this._polyPixel, pos, scale, origin, 0, color);
        }
    }

    public static async resize() {
        const parent = document.querySelector(".game") as HTMLDivElement;
        const cnv = Aquanore.canvas;

        cnv.width = parent.clientWidth;
        cnv.height = parent.clientHeight;
    }

    private static async load() {
        const url = localStorage.getItem("tile-img-data");
        const width = localStorage.getItem("tile-img-width");
        const height = localStorage.getItem("tile-img-height");

        if (!url || !width || !height) {
            return;
        }

        const img = new Image();
        img.src = url;
        img.onload = () => {
            this._texTileset = new Texture(img.width, img.height, img);
            this._polyTileset = Polygon.rectangle(img.width, img.height);
        }
    }

    /* EVENTS */
    private static async onLoadDisk() {
        const el = document.createElement("input");
        el.type = "file";
        el.accept = "image/*";
        el.click();

        el.addEventListener("change", async () => {
            const panel = document.querySelector("#load") as HTMLDivElement;

            if (panel) {
                panel.style.display = "none";
            }

            if (!el.files || el.files.length === 0) {
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const url = reader.result as string;

                const img = new Image();
                img.src = url;
                img.onload = () => {
                    this._texTileset = new Texture(img.width, img.height, img);
                    this._polyTileset = Polygon.rectangle(img.width, img.height);

                    localStorage.setItem("tile-img-data", url);
                    localStorage.setItem("tile-img-width", img.width.toString());
                    localStorage.setItem("tile-img-height", img.height.toString());
                }
            };

            reader.onerror = () => {
                console.error(`Failed to read image file`);
            };

            reader.readAsDataURL(el.files[0]);

            // const url = URL.createObjectURL(el.files[0]);
            // const img = new Image();
            // img.src = url;
            // img.onload = async () => {
            //     this._texTileset = new Texture(img.width, img.height, img);
            //     this._polyTileset = Polygon.rectangle(img.width, img.height);

            //     this._viewX = 0;
            //     this._viewY = 0;

            //     localStorage.setItem("tile-img-data", btoa(url));
            //     localStorage.setItem("tile-img-width", img.width.toString());
            //     localStorage.setItem("tile-img-height", img.height.toString());
            // };
        });
    }
}