import Foundation
import SwiftData

@Model
final class ImagePromptDetail {
    var subject: String
    var composition: String
    var style: String
    var lighting: String
    var camera: String
    var colorTone: String
    var mood: String
    var environment: String
    var negativePrompt: String
    var notes: String

    var project: PromptProject?

    init(
        subject: String = "",
        composition: String = "",
        style: String = "",
        lighting: String = "",
        camera: String = "",
        colorTone: String = "",
        mood: String = "",
        environment: String = "",
        negativePrompt: String = "",
        notes: String = ""
    ) {
        self.subject = subject
        self.composition = composition
        self.style = style
        self.lighting = lighting
        self.camera = camera
        self.colorTone = colorTone
        self.mood = mood
        self.environment = environment
        self.negativePrompt = negativePrompt
        self.notes = notes
    }

    convenience init(snapshot: ImagePromptDetailSnapshot) {
        self.init(
            subject: snapshot.subject,
            composition: snapshot.composition,
            style: snapshot.style,
            lighting: snapshot.lighting,
            camera: snapshot.camera,
            colorTone: snapshot.colorTone,
            mood: snapshot.mood,
            environment: snapshot.environment,
            negativePrompt: snapshot.negativePrompt,
            notes: snapshot.notes
        )
    }

    func apply(snapshot: ImagePromptDetailSnapshot) {
        subject = snapshot.subject
        composition = snapshot.composition
        style = snapshot.style
        lighting = snapshot.lighting
        camera = snapshot.camera
        colorTone = snapshot.colorTone
        mood = snapshot.mood
        environment = snapshot.environment
        negativePrompt = snapshot.negativePrompt
        notes = snapshot.notes
    }

    func makeSnapshot() -> ImagePromptDetailSnapshot {
        ImagePromptDetailSnapshot(
            subject: subject,
            composition: composition,
            style: style,
            lighting: lighting,
            camera: camera,
            colorTone: colorTone,
            mood: mood,
            environment: environment,
            negativePrompt: negativePrompt,
            notes: notes
        )
    }
}
