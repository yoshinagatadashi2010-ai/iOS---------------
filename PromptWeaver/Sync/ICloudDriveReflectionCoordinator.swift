import Foundation

actor ICloudDriveReflectionCoordinator {
    private let markdownExporter: MarkdownFileExporter
    private let jsonExporter: JSONFileExporter
    private let fileManager: FileManager

    init(
        markdownExporter: MarkdownFileExporter,
        jsonExporter: JSONFileExporter,
        fileManager: FileManager = .default
    ) {
        self.markdownExporter = markdownExporter
        self.jsonExporter = jsonExporter
        self.fileManager = fileManager
    }

    func refreshExports(for project: PromptProjectSnapshot) throws {
        guard let folderURL = exportFolderURL() else {
            return
        }

        try fileManager.createDirectory(at: folderURL, withIntermediateDirectories: true, attributes: nil)
        try removeExistingExports(for: project.id, from: folderURL)

        for exporter in [markdownExporter as any PromptExporter, jsonExporter as any PromptExporter] {
            let file = try exporter.makeFile(for: project)
            let destination = folderURL.appendingPathComponent(file.filename)
            try file.data.write(to: destination, options: .atomic)
        }
    }

    func deleteExports(for projectID: UUID) throws {
        guard let folderURL = exportFolderURL(), fileManager.fileExists(atPath: folderURL.path) else {
            return
        }

        try removeExistingExports(for: projectID, from: folderURL)
    }

    func exportFolderDescription() -> String {
        if let folderURL = exportFolderURL() {
            return folderURL.path
        }
        return "iCloud Drive / PromptWeaver / Exports"
    }

    private func exportFolderURL() -> URL? {
        guard let containerURL = fileManager.url(forUbiquityContainerIdentifier: nil) else {
            return nil
        }

        return containerURL
            .appendingPathComponent("Documents", isDirectory: true)
            .appendingPathComponent("PromptWeaver", isDirectory: true)
            .appendingPathComponent("Exports", isDirectory: true)
    }

    private func removeExistingExports(for projectID: UUID, from folderURL: URL) throws {
        let lowercasedID = projectID.uuidString.lowercased()
        let urls = try fileManager.contentsOfDirectory(
            at: folderURL,
            includingPropertiesForKeys: nil,
            options: [.skipsHiddenFiles]
        )

        for url in urls where url.lastPathComponent.contains(lowercasedID) {
            try? fileManager.removeItem(at: url)
        }
    }
}
