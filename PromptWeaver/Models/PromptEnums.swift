import Foundation

enum PromptProjectType: String, Codable, CaseIterable, Identifiable, Sendable {
    case image
    case video
    case audio
    case storyboard
    case multimodal

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .image:
            return "画像"
        case .video:
            return "動画"
        case .audio:
            return "音声"
        case .storyboard:
            return "絵コンテ"
        case .multimodal:
            return "マルチモーダル"
        }
    }

    var fallbackTitle: String {
        switch self {
        case .image:
            return "無題の画像プロンプト"
        case .video:
            return "無題の動画プロンプト"
        case .audio:
            return "無題の音声プロンプト"
        case .storyboard:
            return "無題の絵コンテ"
        case .multimodal:
            return "無題のマルチモーダルプロンプト"
        }
    }
}

enum PromptLanguage: String, Codable, CaseIterable, Identifiable, Sendable {
    case japanese
    case english

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .japanese:
            return "日本語"
        case .english:
            return "英語"
        }
    }
}

enum PromptOutputFormat: String, Codable, CaseIterable, Identifiable, Sendable {
    case markdown
    case plainText
    case structuredBlocks

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .markdown:
            return "Markdown"
        case .plainText:
            return "プレーンテキスト"
        case .structuredBlocks:
            return "構造化ブロック"
        }
    }
}

enum ProjectListFilter: String, CaseIterable, Identifiable, Sendable {
    case all
    case image
    case video

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .all:
            return "すべて"
        case .image:
            return "画像"
        case .video:
            return "動画"
        }
    }
}

enum ProjectSortOption: String, CaseIterable, Identifiable, Sendable {
    case updatedDescending
    case titleAscending
    case favoriteFirst

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .updatedDescending:
            return "更新日時"
        case .titleAscending:
            return "タイトル"
        case .favoriteFirst:
            return "お気に入り優先"
        }
    }
}

enum EditorSaveState: Equatable {
    case idle
    case saving
    case saved(Date)
    case failed(String)

    var label: String {
        switch self {
        case .idle:
            return "未保存"
        case .saving:
            return "保存中..."
        case let .saved(date):
            return "保存済み \(RelativeDateTimeFormatter.promptWeaver.localizedString(for: date, relativeTo: .now))"
        case let .failed(message):
            return "保存失敗: \(message)"
        }
    }
}
