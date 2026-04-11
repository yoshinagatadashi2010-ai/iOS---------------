import XCTest
@testable import PromptWeaver

final class PromptMarkdownGeneratorTests: XCTestCase {
    private let imageBuilder = ImagePromptMarkdownBuilder()
    private let videoBuilder = VideoPromptMarkdownBuilder()

    func testImageMarkdownGenerationIncludesStructuredSections() {
        var snapshot = PromptProjectSnapshot.empty(type: .image, language: .japanese)
        snapshot.title = "商品イメージ"
        snapshot.summary = "新作コスメのキービジュアル"
        snapshot.imageDetail = ImagePromptDetailSnapshot(
            subject: "ガラス台の上の香水ボトル",
            composition: "中央配置のクローズアップ",
            style: "高級感のある広告写真",
            lighting: "ソフトボックスと逆光",
            camera: "50mm macro",
            colorTone: "アイボリーとゴールド",
            mood: "上質",
            environment: "ミニマルスタジオ",
            negativePrompt: "ノイズ、歪み、余計な小物",
            notes: "ラグジュアリー感を崩さない"
        )

        let markdown = imageBuilder.build(from: snapshot)

        XCTAssertTrue(markdown.contains("# Image Prompt"))
        XCTAssertTrue(markdown.contains("## Subject\nガラス台の上の香水ボトル"))
        XCTAssertTrue(markdown.contains("## Negative Prompt\nノイズ、歪み、余計な小物"))
    }

    func testVideoMarkdownOmitsEmptyFields() {
        var snapshot = PromptProjectSnapshot.empty(type: .video, language: .japanese)
        snapshot.videoDetail = VideoPromptDetailSnapshot(
            overallConcept: "",
            visualStyle: "",
            pacing: "",
            aspectRatio: "",
            negativePrompt: "",
            notes: "",
            scenes: [
                VideoSceneSnapshot(
                    id: UUID(),
                    orderIndex: 0,
                    title: "",
                    durationSeconds: 5,
                    content: "最初のシーン",
                    cameraWork: "",
                    subjectMotion: "",
                    background: "",
                    mood: "",
                    soundNote: "",
                    transitionNote: "",
                    notes: ""
                )
            ]
        )

        let markdown = videoBuilder.build(from: snapshot)

        XCTAssertFalse(markdown.contains("## Overall Concept"))
        XCTAssertFalse(markdown.contains("- Camera Work:"))
        XCTAssertTrue(markdown.contains("- Duration: 5s"))
    }

    func testVideoScenesRenderInOrderIndexOrder() {
        var snapshot = PromptProjectSnapshot.empty(type: .video, language: .japanese)
        snapshot.videoDetail = VideoPromptDetailSnapshot(
            overallConcept: "テスト",
            visualStyle: "",
            pacing: "",
            aspectRatio: "",
            negativePrompt: "",
            notes: "",
            scenes: [
                VideoSceneSnapshot(id: UUID(), orderIndex: 2, title: "C", durationSeconds: 3, content: "3番目", cameraWork: "", subjectMotion: "", background: "", mood: "", soundNote: "", transitionNote: "", notes: ""),
                VideoSceneSnapshot(id: UUID(), orderIndex: 0, title: "A", durationSeconds: 1, content: "1番目", cameraWork: "", subjectMotion: "", background: "", mood: "", soundNote: "", transitionNote: "", notes: ""),
                VideoSceneSnapshot(id: UUID(), orderIndex: 1, title: "B", durationSeconds: 2, content: "2番目", cameraWork: "", subjectMotion: "", background: "", mood: "", soundNote: "", transitionNote: "", notes: "")
            ]
        )

        let markdown = videoBuilder.build(from: snapshot)
        let indexA = markdown.range(of: "### Scene 1: A")
        let indexB = markdown.range(of: "### Scene 2: B")
        let indexC = markdown.range(of: "### Scene 3: C")

        XCTAssertNotNil(indexA)
        XCTAssertNotNil(indexB)
        XCTAssertNotNil(indexC)
        XCTAssertLessThan(indexA!.lowerBound, indexB!.lowerBound)
        XCTAssertLessThan(indexB!.lowerBound, indexC!.lowerBound)
    }

    func testDurationFormattingUsesSecondsSuffix() {
        var snapshot = PromptProjectSnapshot.empty(type: .video, language: .japanese)
        snapshot.videoDetail = VideoPromptDetailSnapshot(
            overallConcept: "",
            visualStyle: "",
            pacing: "",
            aspectRatio: "",
            negativePrompt: "",
            notes: "",
            scenes: [
                VideoSceneSnapshot(id: UUID(), orderIndex: 0, title: "Shot", durationSeconds: 9, content: "内容", cameraWork: "", subjectMotion: "", background: "", mood: "", soundNote: "", transitionNote: "", notes: "")
            ]
        )

        let markdown = videoBuilder.build(from: snapshot)

        XCTAssertTrue(markdown.contains("- Duration: 9s"))
    }

    func testEmptyImageTitleFallsBackToDefaultTitle() {
        let snapshot = PromptProjectSnapshot.empty(type: .image, language: .japanese)
        let markdown = imageBuilder.build(from: snapshot)

        XCTAssertTrue(markdown.contains("## Title\n無題の画像プロンプト"))
    }

    func testImageMarkdownIncludesReferenceImageWhenAttached() {
        var snapshot = PromptProjectSnapshot.empty(type: .image, language: .japanese)
        snapshot.imageDetail = ImagePromptDetailSnapshot(
            subject: "テスト",
            composition: "",
            style: "",
            lighting: "",
            camera: "",
            colorTone: "",
            mood: "",
            environment: "",
            negativePrompt: "",
            notes: "",
            referenceImageData: Data([0x01, 0x02, 0x03]),
            referenceImageFilename: "mood-board.png"
        )

        let markdown = imageBuilder.build(from: snapshot)

        XCTAssertTrue(markdown.contains("## Reference Image\nAttached to project: mood-board.png"))
    }
}
