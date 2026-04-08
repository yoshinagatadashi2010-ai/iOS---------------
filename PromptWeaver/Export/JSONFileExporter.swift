import Foundation
import UniformTypeIdentifiers

struct JSONFileExporter: PromptExporter {
    var contentType: UTType { .json }

    func makeFile(for project: PromptProjectSnapshot) throws -> PromptExportFile {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(ISO8601DateFormatter.promptWeaver.string(from: date))
        }

        let data = try encoder.encode(project)
        let filename = "\(project.reflectionBaseFilename).json"
        return PromptExportFile(filename: filename, data: data, contentType: contentType)
    }
}
