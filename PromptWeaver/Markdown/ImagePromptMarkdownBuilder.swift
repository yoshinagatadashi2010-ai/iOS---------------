import Foundation

struct ImagePromptMarkdownBuilder {
    func build(from project: PromptProjectSnapshot) -> String {
        let detail = project.imageDetail ?? .empty
        var lines = ["# Image Prompt", "", "## Title", project.displayTitle, ""]

        appendSection(title: "Summary", content: project.summary, to: &lines)
        appendSection(title: "Subject", content: detail.subject, to: &lines)
        appendSection(title: "Composition", content: detail.composition, to: &lines)
        appendSection(title: "Style", content: detail.style, to: &lines)
        appendSection(title: "Lighting", content: detail.lighting, to: &lines)
        appendSection(title: "Camera", content: detail.camera, to: &lines)
        appendSection(title: "Color Tone", content: detail.colorTone, to: &lines)
        appendSection(title: "Mood", content: detail.mood, to: &lines)
        appendSection(title: "Environment", content: detail.environment, to: &lines)
        appendSection(title: "Reference Image", content: referenceImageDescription(for: detail), to: &lines)
        appendSection(title: "Negative Prompt", content: detail.negativePrompt, to: &lines)
        appendSection(title: "Notes", content: detail.notes, to: &lines)

        return finalize(lines)
    }

    private func appendSection(title: String, content: String, to lines: inout [String]) {
        guard let content = content.trimmedOrNil else {
            return
        }

        lines.append(contentsOf: ["## \(title)", content, ""])
    }

    private func referenceImageDescription(for detail: ImagePromptDetailSnapshot) -> String? {
        guard detail.referenceImageData != nil else {
            return nil
        }

        if let filename = detail.referenceImageFilename?.trimmedOrNil {
            return "Attached to project: \(filename)"
        }

        return "Attached to project"
    }

    private func finalize(_ lines: [String]) -> String {
        var finalized = lines
        while finalized.last?.isEmpty == true {
            finalized.removeLast()
        }
        return finalized.joined(separator: "\n")
    }
}
