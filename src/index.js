import path from 'path';

import mime from 'mime';
import loaderUtils from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';

export default function loader(content) {
  const options = loaderUtils.getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'File Loader',
    baseDataPath: 'options',
  });

  const hasInlineFlag = /\?__inline$/.test(this.resource);

  if (hasInlineFlag) {
    const file = this.resourcePath;
    // Get MIME type
    const mimetype = options.mimetype || mime.getType(file);

    if (typeof content === 'string') {
      content = Buffer.from(content);
    }

    return `module.exports = ${JSON.stringify(
      `data:${mimetype || ''};base64,${content.toString('base64')}`
    )}`;
  }

  const context = options.context || this.rootContext;

  const url = loaderUtils.interpolateName(
    this,
    options.name || '[contenthash].[ext]',
    {
      context,
      content,
      regExp: options.regExp,
    }
  );

  let outputPath = url;

  if (options.outputPath) {
    if (typeof options.outputPath === 'function') {
      outputPath = options.outputPath(url, this.resourcePath, context);
    } else {
      outputPath = path.posix.join(options.outputPath, url);
    }
  }

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;

  if (options.publicPath) {
    if (typeof options.publicPath === 'function') {
      publicPath = options.publicPath(url, this.resourcePath, context);
    } else {
      publicPath = `${
        options.publicPath.endsWith('/')
          ? options.publicPath
          : `${options.publicPath}/`
      }${url}`;
    }

    publicPath = JSON.stringify(publicPath);
  }

  if (options.postTransformPublicPath) {
    publicPath = options.postTransformPublicPath(publicPath);
  }

  if (typeof options.emitFile === 'undefined' || options.emitFile) {
    this.emitFile(outputPath, content);
  }

  // TODO revert to ES2015 Module export, when new CSS Pipeline is in place
  return `module.exports = ${publicPath};`;
}

export const raw = true;
