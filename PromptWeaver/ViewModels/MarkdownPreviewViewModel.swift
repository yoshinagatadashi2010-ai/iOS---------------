import Foundation
import Combine
import UIKit

struct PreparedExport: Identifiable {
    let id = UUID()
    let document: ExportDocument
    let filename: String
}

@MainActor
final class MarkdownPreviewViewModel: ObservableObject {
    let snapshot: PromptProjectSnapshot
    let markdown: String

    @Published var errorMessage: String?

    private let markdownExporter: MarkdownFileExporter
    private let jsonExporter: JSONFileExporter

    init(
        snapshot: PromptProjectSnapshot,
        markdownExporter: MarkdownFileExporter = AppContainer.shared.markdownExporter,
        jsonExporter: JSONFileExporter = AppContainer.shared.jsonExporter
    ) {
        self.snapshot = snapshot
        self.markdownExporter = markdownExporter
        self.jsonExporter = jsonExporter
        markdown = markdownExporter.markdownGenerator.generateMarkdown(from: snapshot)
    }

    func copyToPasteboard() {
        UIPasteboard.general.string = markdown
    }

    func makeMarkdownExport() -> PreparedExport? {
        makePreparedExport(using: markdownExporter)
    }

    func makeJSONExport() -> PreparedExport? {
        makePreparedExport(using: jsonExporter)
    }

    private func makePreparedExport(using exporter: any PromptExporter) -> PreparedExport? {
        do {
            let file = try exporter.makeFile(for: snapshot)
            let document = ExportDocument(data: file.data, contentType: file.contentType)
            return PreparedExport(document: document, filename: file.filename)
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }
}

