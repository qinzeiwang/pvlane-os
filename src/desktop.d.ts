interface Window {
  pvlaneDesktop?: {
    saveFile(kind: 'project' | 'report', suggestedName: string, content: string): Promise<string | null>;
    exportPdf(html: string, name: string): Promise<string | null>;
  };
}
