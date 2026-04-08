import Foundation
import SwiftData

enum PreviewSampleData {
    static let imageSnapshot: PromptProjectSnapshot = {
        var snapshot = PromptProjectSnapshot.empty(type: .image, language: .japanese)
        snapshot.title = "夕景ポートレート"
        snapshot.summary = "夕暮れの街で自然光を活かした人物ポートレートを作るための下書きです。"
        snapshot.tags = ["portrait", "sunset", "cinematic"]
        snapshot.favorite = true
        snapshot.imageDetail = ImagePromptDetailSnapshot(
            subject: "駅前に立つ女性モデル",
            composition: "バストアップ、ややローアングル",
            style: "シネマティックで繊細",
            lighting: "夕方の逆光と街灯の補助光",
            camera: "85mm lens, shallow depth of field",
            colorTone: "オレンジとティール",
            mood: "静かで感傷的",
            environment: "都市の夕景、濡れた歩道",
            negativePrompt: "低解像度、破綻した手、不自然な肌",
            notes: "広告ビジュアルにも使える上品さを保つ"
        )
        return snapshot
    }()

    static let videoSnapshot: PromptProjectSnapshot = {
        var snapshot = PromptProjectSnapshot.empty(type: .video, language: .japanese)
        snapshot.title = "未来都市の朝"
        snapshot.summary = "短尺の世界観紹介動画。静けさから始まり、街が目覚める流れを意識します。"
        snapshot.tags = ["future", "city", "shortfilm"]
        snapshot.videoDetail = VideoPromptDetailSnapshot(
            overallConcept: "近未来都市の朝を3シーンで描く",
            visualStyle: "クリーンなSF、フォトリアル",
            pacing: "ゆっくり始まり後半で少しテンポアップ",
            aspectRatio: "9:16",
            negativePrompt: "ちらつき、過剰なモーションブラー、破綻した背景",
            notes: "SNS向け縦動画を想定",
            scenes: [
                VideoSceneSnapshot(
                    id: UUID(),
                    orderIndex: 0,
                    title: "夜明け前の街",
                    durationSeconds: 4,
                    content: "静かな高層ビル群を遠景で見せる",
                    cameraWork: "ゆっくり前進するドローンショット",
                    subjectMotion: "空飛ぶ小型ビークルがわずかに横切る",
                    background: "ガラス張りのビルと薄い霧",
                    mood: "静謐",
                    soundNote: "低い環境音のみ",
                    transitionNote: "フェードで次へ",
                    notes: "空のグラデーションを丁寧に"
                ),
                VideoSceneSnapshot(
                    id: UUID(),
                    orderIndex: 1,
                    title: "通りに光が差す",
                    durationSeconds: 5,
                    content: "メインストリートに朝日が差し込む",
                    cameraWork: "水平移動",
                    subjectMotion: "通勤者の流れが増えていく",
                    background: "ホログラム看板と反射する路面",
                    mood: "希望",
                    soundNote: "軽いシンセパッド",
                    transitionNote: "光のフレアでつなぐ",
                    notes: "人の密度は控えめ"
                )
            ]
        )
        return snapshot
    }()

    static func seedIfNeeded(into context: ModelContext) {
        let descriptor = FetchDescriptor<PromptProject>()
        if let existing = try? context.fetch(descriptor), !existing.isEmpty {
            return
        }

        context.insert(PromptProject(snapshot: imageSnapshot))
        context.insert(PromptProject(snapshot: videoSnapshot))
        try? context.save()
    }
}
