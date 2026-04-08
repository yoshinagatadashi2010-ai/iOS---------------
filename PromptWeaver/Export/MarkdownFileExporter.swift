import Foundation
import UniformTypeIdentifiers

struct MarkdownFileExporter: PromptExporter {
    let markdownGenerator: PromptMarkdownGenerator

    var contentType: UTType { .markdown }

    func makeFile(for project: PromptProjectSnapshot) throws -> PromptExportFile {
        let markdown = markdownGenerator.generateMarkdown(from: project)
        let data = Data(markdown.utf8)
        let filename = "\(project.reflectionBaseFilename).md"
        return PromptExportFile(filename: filename, data: data, contentType: contentType)
    }
}
