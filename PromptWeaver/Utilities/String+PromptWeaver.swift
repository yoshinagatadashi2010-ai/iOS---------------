import Foundation

extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var trimmedOrNil: String? {
        let value = trimmed
        return value.isEmpty ? nil : value
    }

    func slugifiedFilenameComponent(fallback: String) -> String {
        let normalized = folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
            .lowercased()

        let pieces = normalized
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }

        let slug = pieces.joined(separator: "-")
        return slug.isEmpty ? fallback : slug
    }
}
