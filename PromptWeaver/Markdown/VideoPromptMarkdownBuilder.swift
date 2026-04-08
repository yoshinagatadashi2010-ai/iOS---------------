import Foundation

struct VideoPromptMarkdownBuilder {
    func build(from project: PromptProjectSnapshot) -> String {
        let detail = project.videoDetail ?? .empty
        var lines = ["# Video Prompt", "", "## Title", project.displayTitle, ""]

        appendSection(title: "Summary", content: project.summary, to: &lines)
        appendSection(title: "Overall Concept", content: detail.overallConcept, to: &lines)
        appendSection(title: "Visual Style", content: detail.visualStyle, to: &lines)
        appendSection(title: "Pacing", content: detail.pacing, to: &lines)
        appendSection(title: "Aspect Ratio", content: detail.aspectRatio, to: &lines)

        let scenes = detail.scenes.sorted(by: VideoSceneSnapshot.displayOrderSort)
        if !scenes.isEmpty {
            lines.append(contentsOf: ["## Scenes", ""])

            for (index, scene) in scenes.enumerated() {
                let sceneTitle = scene.title.trimmedOrNil ?? "Scene \(index + 1)"
                lines.append("### Scene \(index + 1): \(sceneTitle)")
                lines.append("- Duration: \(max(1, scene.durationSeconds))s")
                appendBullet(label: "Content", content: scene.content, to: &lines)
                appendBullet(label: "Camera Work", content: scene.cameraWork, to: &lines)
                appendBullet(label: "Subject Motion", content: scene.subjectMotion, to: &lines)
                appendBullet(label: "Background", content: scene.background, to: &lines)
                appendBullet(label: "Mood", content: scene.mood, to: &lines)
                appendBullet(label: "Sound Note", content: scene.soundNote, to: &lines)
                appendBullet(label: "Transition", content: scene.transitionNote, to: &lines)
                appendBullet(label: "Notes", content: scene.notes, to: &lines)
                lines.append("")
            }
        }

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

    private func appendBullet(label: String, content: String, to lines: inout [String]) {
        guard let content = content.trimmedOrNil else {
            return
        }

        lines.append("- \(label): \(content)")
    }

    private func finalize(_ lines: [String]) -> String {
        var finalized = lines
        while finalized.last?.isEmpty == true {
            finalized.removeLast()
        }
        return finalized.joined(separator: "\n")
    }
}
