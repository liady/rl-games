const { override, addDecoratorsLegacy } = require('customize-cra');

module.exports = {
    webpack: override(
        // usual webpack plugin
        addDecoratorsLegacy()
    ),
};
