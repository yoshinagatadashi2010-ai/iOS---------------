import Foundation

struct PromptTemplate: Identifiable, Codable, Hashable, Sendable {
    var id: UUID = UUID()
    var name: String
    var projectType: PromptProjectType
    var description: String

    // TODO: v2でAIサービス別の出力スタイルやカスタムフィールド定義を保持する。
    var supportedOutputFormats: [PromptOutputFormat] = [.markdown]
}
