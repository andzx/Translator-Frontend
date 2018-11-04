export class Autosave  {
    projectId;
    segmentId;
    data;
    date;

    constructor(projectId: number, segmentId: number, data: string) {
        this.projectId = projectId;
        this.segmentId = segmentId;
        this.data = data;
        this.date = new Date().getDate();
    }
 }
