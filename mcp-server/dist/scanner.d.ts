export type ComponentEngine = "WEBGL 3D" | "CANVAS 2D" | "DOM 3D" | "REACT / TSX" | "CSS / HTML";
export interface ComponentRecord {
    id: string;
    legacyId: string;
    name: string;
    title: string;
    category: string;
    filename: string;
    absolutePath: string;
    format: string;
    engine: ComponentEngine;
    background: string;
    colors: string[];
    shaderColors: string[];
    fonts: string[];
    interactions: string[];
    localImages: string[];
    tags: string[];
    commentSummary: string;
    byteSize: number;
    mtimeMs: number;
}
export interface SearchMatch {
    component: ComponentRecord;
    score: number;
    matchedFields: string[];
}
export declare class ComponentLibraryIndex {
    private readonly workspaceRoot;
    private readonly componentsDir;
    private records;
    private lastScanMs;
    constructor(workspaceRoot: string, componentsDir: string);
    getComponentsDir(): string;
    getWorkspaceRoot(): string;
    scan(): ComponentRecord[];
    /** Refresh index at most every 2 seconds so newly dropped component files appear automatically. */
    getAll(forceRefresh?: boolean): ComponentRecord[];
    search(query: string, options?: {
        category?: string;
        engine?: string;
        limit?: number;
    }): SearchMatch[];
    findByIdOrFilename(identifier: string): ComponentRecord | undefined;
    readRawSource(comp: ComponentRecord): string;
    buildDesignSystemGuide(): string;
}
