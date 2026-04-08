import Foundation
import UniformTypeIdentifiers

struct PromptExportFile {
    let filename: String
    let data: Data
    let contentType: UTType
}

protocol PromptExporter {
    var contentType: UTType { get }
    func makeFile(for project: PromptProjectSnapshot) throws -> PromptExportFile
}
