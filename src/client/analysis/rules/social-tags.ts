import type { Analyzer } from '../types';

export const REQUIRED: Array<[string, string]> = [
  ['ogTitle', 'OpenGraph 标题'],
  ['ogDescription', 'OpenGraph 描述'],
  ['ogImage', 'OpenGraph 图片'],
  ['twitterCard', 'Twitter 分享卡片'],
];

// Flag missing share-preview metadata
const socialTags: Analyzer = (d) => {
  const missing = REQUIRED.filter(([k]) => !d[k]).map(([, l]) => l);
  if (!missing.length) return [{ severity: 'pass', title: '社交分享标签完整' }];
  return [
    {
      severity: 'warning',
      title: `缺少 ${missing.length} 项社交分享标签`,
      detail: `可补充 ${missing.join('、')}，改善分享预览效果`,
    },
  ];
};

export default socialTags;
