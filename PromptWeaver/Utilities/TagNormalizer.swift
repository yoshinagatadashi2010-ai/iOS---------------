import Foundation

enum TagNormalizer {
    static func parse(text: String) -> [String] {
        let separators = CharacterSet(charactersIn: ",、\n")
        return text
            .components(separatedBy: separators)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .reduce(into: [String]()) { result, tag in
                if !result.contains(where: { $0.caseInsensitiveCompare(tag) == .orderedSame }) {
                    result.append(tag)
                }
            }
    }

    static func normalize(_ tags: [String]) -> [String] {
        parse(text: tags.joined(separator: ","))
    }

    static func serialize(_ tags: [String]) -> String {
        normalize(tags).joined(separator: ", ")
    }

    static func deserialize(_ rawValue: String) -> [String] {
        parse(text: rawValue)
    }
}
