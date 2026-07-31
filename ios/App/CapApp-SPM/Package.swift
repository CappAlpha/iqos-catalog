// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.5.0"),
        .package(name: "CapacitorCommunityBluetoothLe", path: "..\..\..\node_modules\@capacitor-community\bluetooth-le"),
        .package(name: "CapacitorApp", path: "..\..\..\node_modules\@capacitor\app"),
        .package(name: "CapacitorFileTransfer", path: "..\..\..\node_modules\@capacitor\file-transfer"),
        .package(name: "CapacitorFilesystem", path: "..\..\..\node_modules\@capacitor\filesystem"),
        .package(name: "CapacitorPreferences", path: "..\..\..\node_modules\@capacitor\preferences"),
        .package(name: "CapawesomeTeamCapacitorFileOpener", path: "..\..\..\node_modules\@capawesome-team\capacitor-file-opener")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorCommunityBluetoothLe", package: "CapacitorCommunityBluetoothLe"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorFileTransfer", package: "CapacitorFileTransfer"),
                .product(name: "CapacitorFilesystem", package: "CapacitorFilesystem"),
                .product(name: "CapacitorPreferences", package: "CapacitorPreferences"),
                .product(name: "CapawesomeTeamCapacitorFileOpener", package: "CapawesomeTeamCapacitorFileOpener")
            ]
        )
    ]
)
