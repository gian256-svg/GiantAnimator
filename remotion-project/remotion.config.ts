import { Config } from "@remotion/cli/config";

// Allows Chrome to load file:/// paths from the local machine during render
Config.setChromiumDisableWebSecurity(true);

// Override Webpack to support all image formats (RULE: Ampla compatibilidade de assets)
Config.overrideWebpackConfig((current) => {
  return {
    ...current,
    module: {
      ...current.module,
      rules: [
        ...(current.module?.rules ?? []),
        {
          test: /\.(svg|webp|gif|avif|bmp|ico|tiff|tif)$/i,
          type: "asset/resource",
        },
      ],
    },
  };
});
