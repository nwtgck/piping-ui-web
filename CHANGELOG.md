# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

## [Unreleased]

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

[Unreleased]: https://github.com/nwtgck/piping-ui-web/compare/v0.4.20...HEAD
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
