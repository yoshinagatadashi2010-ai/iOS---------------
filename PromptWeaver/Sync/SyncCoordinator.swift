import Foundation
import Combine

@MainActor
final class SyncCoordinator: ObservableObject {
    private let settingsStore: SettingsStore
    private let reflectionCoordinator: ICloudDriveReflectionCoordinator
    private var pendingTasks: [UUID: Task<Void, Never>] = [:]

    init(settingsStore: SettingsStore, reflectionCoordinator: ICloudDriveReflectionCoordinator) {
        self.settingsStore = settingsStore
        self.reflectionCoordinator = reflectionCoordinator
    }

    func projectDidSave(_ snapshot: PromptProjectSnapshot) {
        guard settingsStore.isICloudDriveReflectionEnabled else {
            return
        }

        pendingTasks[snapshot.id]?.cancel()
        pendingTasks[snapshot.id] = Task { [weak self] in
            guard let self else {
                return
            }

            try? await Task.sleep(for: .milliseconds(600))
            guard !Task.isCancelled else {
                return
            }
            try? await self.reflectionCoordinator.refreshExports(for: snapshot)
            self.pendingTasks[snapshot.id] = nil
        }
    }

    func projectDidDelete(_ projectID: UUID) {
        pendingTasks[projectID]?.cancel()
        pendingTasks[projectID] = Task { [weak self] in
            guard let self else {
                return
            }
            try? await self.reflectionCoordinator.deleteExports(for: projectID)
            self.pendingTasks[projectID] = nil
        }
    }
}

