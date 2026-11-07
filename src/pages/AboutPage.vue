<script setup>
import { site } from '../data.js'
import PageIntro from '../components/PageIntro.vue'
import { usePageHead } from '../composables/usePageHead.js'
usePageHead('关于我', 'SubmergePSC 的项目、技术笔记与在线工具。')
</script>

<template>
  <PageIntro
    eyebrow="ABOUT ME"
    title="你好，我是"
    :accent="`${site.author}。`"
    description="这里是我的个人主页，分享项目实践、技术笔记和随手可用的工具。"
  />
  <section class="about-body shell">
    <article class="prose">
      <h2>我在做什么</h2>
      <p>我关注软件开发与数据实验。这里展示 MoonBit Markdown 渲染器、绘图工作流和时间序列预测实验，也整理测试、复现和工具使用中的思考。</p>
      <h2>从哪里开始</h2>
      <p>项目页介绍实现思路并提供代码入口；笔记记录具体问题和方法；工具箱提供图片链接转换、JSON 格式化、编码转换和文本整理等功能。</p>
      <div class="about-links">
        <RouterLink to="/projects/">项目 ↗</RouterLink>
        <RouterLink to="/garden/">技术笔记 ↗</RouterLink>
        <a :href="site.github">GitHub ↗</a>
      </div>
    </article>
    <aside class="about-aside">
      <span>BUILD · LEARN · SHARE</span>
      <p>把想法做出来，<br>把过程留下来。</p>
      <i>✳</i>
    </aside>
  </section>
</template>
