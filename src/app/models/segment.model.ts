export class Segment {
    id;
    projectId;
    title;
    sourceText;
    targetText;
    complete = 0;

    constructor(id?: number, projectId?: number, title?: string, sourceText?: string, targetText?: string, complete?: number) {
        this.id = id;
        this.projectId = projectId;
        this.title = title;
        this.sourceText = sourceText;
        this.targetText = targetText;
        this.complete = complete;
    }
 }
