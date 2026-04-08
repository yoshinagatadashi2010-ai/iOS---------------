import Foundation
import SwiftData

@Model
final class VideoPromptDetail {
    var overallConcept: String
    var visualStyle: String
    var pacing: String
    var aspectRatio: String
    var negativePrompt: String
    var notes: String

    @Relationship(deleteRule: .cascade, inverse: \VideoScene.videoDetail)
    var scenes: [VideoScene]

    var project: PromptProject?

    init(
        overallConcept: String = "",
        visualStyle: String = "",
        pacing: String = "",
        aspectRatio: String = "",
        negativePrompt: String = "",
        notes: String = "",
        scenes: [VideoScene] = []
    ) {
        self.overallConcept = overallConcept
        self.visualStyle = visualStyle
        self.pacing = pacing
        self.aspectRatio = aspectRatio
        self.negativePrompt = negativePrompt
        self.notes = notes
        self.scenes = scenes
    }

    convenience init(snapshot: VideoPromptDetailSnapshot) {
        self.init(
            overallConcept: snapshot.overallConcept,
            visualStyle: snapshot.visualStyle,
            pacing: snapshot.pacing,
            aspectRatio: snapshot.aspectRatio,
            negativePrompt: snapshot.negativePrompt,
            notes: snapshot.notes,
            scenes: snapshot.scenes.map(VideoScene.init(snapshot:))
        )
    }

    func apply(snapshot: VideoPromptDetailSnapshot) {
        overallConcept = snapshot.overallConcept
        visualStyle = snapshot.visualStyle
        pacing = snapshot.pacing
        aspectRatio = snapshot.aspectRatio
        negativePrompt = snapshot.negativePrompt
        notes = snapshot.notes

        let existingByID = Dictionary(uniqueKeysWithValues: scenes.map { ($0.id, $0) })
        let incomingIDs = Set(snapshot.scenes.map(\.id))

        scenes.removeAll { !incomingIDs.contains($0.id) }

        for sceneSnapshot in snapshot.scenes.sorted(by: VideoSceneSnapshot.displayOrderSort) {
            if let existingScene = existingByID[sceneSnapshot.id] {
                existingScene.apply(snapshot: sceneSnapshot)
            } else {
                let newScene = VideoScene(snapshot: sceneSnapshot)
                newScene.videoDetail = self
                scenes.append(newScene)
            }
        }

        scenes.sort { lhs, rhs in
            if lhs.orderIndex == rhs.orderIndex {
                return lhs.id.uuidString < rhs.id.uuidString
            }
            return lhs.orderIndex < rhs.orderIndex
        }
    }

    func makeSnapshot() -> VideoPromptDetailSnapshot {
        VideoPromptDetailSnapshot(
            overallConcept: overallConcept,
            visualStyle: visualStyle,
            pacing: pacing,
            aspectRatio: aspectRatio,
            negativePrompt: negativePrompt,
            notes: notes,
            scenes: scenes.map(\.makeSnapshot).sorted(by: VideoSceneSnapshot.displayOrderSort)
        )
    }
}
