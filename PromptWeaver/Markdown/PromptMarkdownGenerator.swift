import Foundation

protocol PromptMarkdownGenerator {
    func generateMarkdown(from project: PromptProjectSnapshot) -> String
}
