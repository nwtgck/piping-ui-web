# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

## [Unreleased]

## [0.7.3] - 2022-08-23
### Fixed
- Encryption support for Firefox ESR

## [0.7.2] - 2022-08-21
### Fixed
- Fix feature detection of streaming upload in Safari

## [0.7.1] - 2022-08-21
### Fixed
- Always non-streaming encrypted upload in Safari

## [0.7.0] - 2022-08-21
### Changed
- Update dependencies
- Disable service worker cache
- Add file extension in view mode when downloading transferred file without extension

### Added
- Support streaming encrypted upload

### Fixed
- Copy correct text to clipboard

## [0.6.30] - 2022-07-19
### Changed
- Update dependencies

## [0.6.29] - 2021-12-22
### Changed
- Update dependencies
- Reorder Piping Server URLs

## [0.6.28] - 2020-12-31
### Changed
- Update dependencies

## [0.6.27] - 2020-11-11
### Changed
- Update dependencies

## [0.6.26] - 2020-09-30
### Changed
- Update dependencies
- Update structure of key exchange parcel for future update

## [0.6.25] - 2020-08-11
### Changed
- Update dependencies
- Not make DarkReader make Piping UI dark again

## [0.6.24] - 2020-07-30
### Changed
- Update dependencies

## [0.6.23] - 2020-07-17
### Changed
- Update dependencies

## [0.6.22] - 2020-07-15
### Changed
- Update dependencies

### Fixed
- Not discard sanitized tags

## [0.6.21] - 2020-06-25
### Changed
- Update dependencies

## [0.6.20] - 2020-06-15
### Changed
- Update dependencies

## [0.6.19] - 2020-06-07
### Changed
- Update dependencies

## [0.6.18] - 2020-06-02
### Changed
- Update dependencies
- Not cache the logic of peer verification (internal implementation)

## [0.6.17] - 2020-05-25
### Changed
- Update dependencies

## [0.6.16] - 2020-04-24
### Changed
- Update dependencies

## [0.6.15] - 2020-04-15
### Changed
- Update dependencies

## [0.6.14] - 2020-04-13
### Changed
- Update dependencies

## [0.6.13] - 2020-04-07
### Changed
- Update dependencies

## [0.6.12] - 2020-04-02
### Changed
- Update dependencies

## [0.6.11] - 2020-03-21
### Changed
- Update dependencies

## [0.6.10] - 2020-03-14
### Changed
- Update dependencies

## [0.6.9] - 2020-03-10
### Changed
- Update dependencies

## [0.6.8] - 2020-02-28
### Changed
- Update dependencies

## [0.6.7] - 2020-02-26
### Changed
- Update dependencies

## [0.6.6] - 2020-02-21
### Changed
- Update dependencies
- Improve Blob URL management in DataViewer
- Use type-only import

## [0.6.5] - 2020-02-13
### Changed
- Update dependencies

## [0.6.4] - 2020-02-11
### Changed
- Update dependencies

## [0.6.3] - 2020-02-07
### Changed
- Update dependencies

## [0.6.2] - 2020-02-05
### Changed
- Update dependencies

### Added
- Netlify deploy from GitHub Actions

## [0.6.1] - 2020-02-02
### Changed
- Update dependencies

## [0.6.0] - 2020-01-27
### Changed
- Update dependencies
- Update default Piping Server URLs

## [0.5.1] - 2020-01-24
### Changed
- Update dependencies
- Improve logic of checking stream-download support
- Support stream-download on Firefox

## [0.5.0] - 2020-01-21
### Changed
- Update dependencies
- Not pass download info including secret path and password to URL fragment in stream download

## [0.4.31] - 2020-01-15
### Changed
- Update dependencies

## [0.4.30] - 2020-01-14
### Changed
- Update dependencies

## [0.4.29] - 2020-01-12
### Changed
- Update dependency
- Make fonts of URLs and secret paths easier to distinguish similar words

### Fixed
- Fix to copy text

## [0.4.28] - 2020-01-12
### Fixed
- Remove warnings of Web Share Target API

## [0.4.27] - 2020-01-11
### Added
- Support Web Share Target API

## [0.4.26] - 2020-01-11
### Changed
- Update dependencies

## [0.4.25] - 2020-01-10
### Changed
- Update dependencies

### Fixed
- Auto-scroll to more proper position

## [0.4.24] - 2020-01-06
### Changed
- Update dependencies
- Scroll down to DataUploader/Viewer/Downloader after action

## [0.4.23] - 2020-01-05
### Changed
- Update dependencies
- Hide "Protect with password" display when enabled

## [0.4.22] - 2019-12-31
### Changed
- Update dependencies

## [0.4.21] - 2019-12-29
### Changed
- Update dependencies

## [0.4.20] - 2019-12-25
### Changed
- Update dependencies
- Improve initial rendering speed

## [0.4.19] - 2019-12-21
### Changed
- Update dependencies

## [0.4.18] - 2019-12-20
### Changed
- `robots.txt` has `Sitemap: ...` when `$SITE_URL` is specified at build-time
- Update dependency

## [0.4.17] - 2019-12-19
### Changed
- Update dependency

## Added
- Sitemap generation

## [0.4.16] - 2019-12-19
### Changed
- Update dependencies

## [0.4.15] - 2019-12-18
### Changed
- Update dependency
- Support dynamic meta description

## [0.4.14] - 2019-12-16
### Fixed
- Support Edge, not to show a blank page

## [0.4.13] - 2019-12-15
### Added
- Allow builders to change default Piping Server URLs at build-time

### Changed
- Use "./" as publicPath
- Remove public/_redirects

## [0.4.12] - 2019-12-15
### Changed
- Update dependencies

## [0.4.11] - 2019-12-12
### Changed
- Update dependencies

## [0.4.10] - 2019-12-11
### Changed
- Update dependencies

## [0.4.9] - 2019-12-09
### Changed
- Update dependencies

## [0.4.8] - 2019-12-06
### Changed
- Update dependencies

## [0.4.7] - 2019-12-03
### Changed
- Update dependencies

## [0.4.6] - 2019-11-29
### Fixed
- Not update app using browser reload, to work properly when an update is available

## [0.4.5] - 2019-11-29
### Changed
- Update dependencies

## [0.4.4] - 2019-11-27
### Changed
- Update dependencies

## [0.4.3] - 2019-11-27
### Changed
- Update dependencies
- Add random secret path without extension for file and zip inputs

## [0.4.2] - 2019-11-24
### Changed
- Update dependencies
- Update app using browser reload, not only PWA update button

## [0.4.1] - 2019-11-21
### Changed
- Update dependencies

## [0.4.0] - 2019-11-19
### Changed
- Update dependencies
- Merge data uploader and data viewer together

## Added
- Add passwordless protection 

## [0.3.1] - 2019-11-06
### Changed
- Update dependencies

## [0.3.0] - 2019-11-01
### Changed
- Update dependencies
- Add secret path so that the most recently used one is at the top

### Added
- Allow user to paste a file in clipboard

## [0.2.0] - 2019-10-28
### Changed
- Update dependencies

### Added
- Add password protection by [OpenPGP.js](https://github.com/openpgpjs/openpgpjs)

## [0.1.5] - 2019-10-14
### Changed
- Update dependencies

### Fixed
- Set dark theme in initial page
- Wait to show text viewer until sanitized text is ready
- Not auto-refresh in first visiting

## [0.1.4] - 2019-10-10
### Changed
- Detect MIME type from binary data by magic number
- Make text input clearable
- Load components asynchronously
- Update dependencies

## [0.1.3] - 2019-09-28
### Changed
- Update dependency
- Import Workbox from local, not CDN

## [0.1.2] - 2019-09-25
### Changed
- Update dependency

## [0.1.1] - 2019-09-23
### Fixed
- Apply latest server URL and secret path inputs

## 0.1.0 - 2019-09-23
### Added
- First release

[Unreleased]: https://github.com/nwtgck/piping-ui-web/compare/v0.7.3...HEAD
[0.7.3]: https://github.com/nwtgck/piping-ui-web/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/nwtgck/piping-ui-web/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/nwtgck/piping-ui-web/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.30...v0.7.0
[0.6.30]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.29...v0.6.30
[0.6.29]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.28...v0.6.29
[0.6.28]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.27...v0.6.28
[0.6.27]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.26...v0.6.27
[0.6.26]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.25...v0.6.26
[0.6.25]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.24...v0.6.25
[0.6.24]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.23...v0.6.24
[0.6.23]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.22...v0.6.23
[0.6.22]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.21...v0.6.22
[0.6.21]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.20...v0.6.21
[0.6.20]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.19...v0.6.20
[0.6.19]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.18...v0.6.19
[0.6.18]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.17...v0.6.18
[0.6.17]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.16...v0.6.17
[0.6.16]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.15...v0.6.16
[0.6.15]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.14...v0.6.15
[0.6.14]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.13...v0.6.14
[0.6.13]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.12...v0.6.13
[0.6.12]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.11...v0.6.12
[0.6.11]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.10...v0.6.11
[0.6.10]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.9...v0.6.10
[0.6.9]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.8...v0.6.9
[0.6.8]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.7...v0.6.8
[0.6.7]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/nwtgck/piping-ui-web/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/nwtgck/piping-ui-web/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/nwtgck/piping-ui-web/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.31...v0.5.0
[0.4.31]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.30...v0.4.31
[0.4.30]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.29...v0.4.30
[0.4.29]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.28...v0.4.29
[0.4.28]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.27...v0.4.28
[0.4.27]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.26...v0.4.27
[0.4.26]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.25...v0.4.26
[0.4.25]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.24...v0.4.25
[0.4.24]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.23...v0.4.24
[0.4.23]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.22...v0.4.23
[0.4.22]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.21...v0.4.22
[0.4.21]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.20...v0.4.21
[0.4.20]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.19...v0.4.20
[0.4.19]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.18...v0.4.19
[0.4.18]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.17...v0.4.18
[0.4.17]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.16...v0.4.17
[0.4.16]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.15...v0.4.16
[0.4.15]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.14...v0.4.15
[0.4.14]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.13...v0.4.14
[0.4.13]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.12...v0.4.13
[0.4.12]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.11...v0.4.12
[0.4.11]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.10...v0.4.11
[0.4.10]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.9...v0.4.10
[0.4.9]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.8...v0.4.9
[0.4.8]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.7...v0.4.8
[0.4.7]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.6...v0.4.7
[0.4.6]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/nwtgck/piping-ui-web/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/nwtgck/piping-ui-web/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/nwtgck/piping-ui-web/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/nwtgck/piping-ui-web/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/nwtgck/piping-ui-web/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/nwtgck/piping-ui-web/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/nwtgck/piping-ui-web/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/nwtgck/piping-ui-web/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/nwtgck/piping-ui-web/compare/v0.1.0...v0.1.1
