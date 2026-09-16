# Gradle dependency verification

The generated Android Gradle project uses Gradle dependency verification as a supply-chain control in addition to exact dependency versions and Gradle wrapper validation.

The reviewed baseline is committed at `src-tauri/gen/android/gradle/verification-metadata.xml`. Its current byte-for-byte review anchor is:

- size: `240592` bytes;
- SHA-256: `8f4bdf5eda5cbdf8d84a42bd8eca04e976b5b0b605cda7ce808edc4155c6c6ad`;
- `verify-metadata=true`;
- `verify-signatures=false`;
- resolved artifacts are pinned with SHA-256 checksums.

Normal CI and release workflows must consume the committed metadata in Gradle's strict default mode. They must not pass `--dependency-verification off`, `--dependency-verification lenient`, or `--write-verification-metadata`.

## Updating dependencies

When an intentional dependency or plugin upgrade changes the resolved graph:

1. regenerate SHA-256 verification metadata only in a trusted review environment using the real Android release AAB and APK task graphs;
2. independently review the generated checksum diff instead of trusting the bootstrap run by itself;
3. commit the reviewed `verification-metadata.xml` directly, with no generation step in production CI;
4. update the expected size and SHA-256 in `src/gradle-dependency-verification.test.ts` as an explicit review acknowledgement;
5. run the normal frontend/Rust tests plus Native Android AAB/APK verification and the applicable Native Release checks.

The Gradle distribution checksum and wrapper-JAR validation are separate controls and remain required.
