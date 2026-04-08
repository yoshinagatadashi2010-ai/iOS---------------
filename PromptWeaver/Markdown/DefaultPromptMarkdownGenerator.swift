import Foundation

struct DefaultPromptMarkdownGenerator: PromptMarkdownGenerator {
    private let imageBuilder = ImagePromptMarkdownBuilder()
    private let videoBuilder = VideoPromptMarkdownBuilder()

    func generateMarkdown(from project: PromptProjectSnapshot) -> String {
        switch project.projectType {
        case .image:
            return imageBuilder.build(from: project)
        case .video:
            return videoBuilder.build(from: project)
        case .audio, .storyboard, .multimodal:
            return "# Prompt\n\n## Title\n\(project.displayTitle)"
        }
    }
}
