---
layout: default
title: Blog
---

<h1>blog</h1>
<ul>
  {% for post in site.posts %}
    <li>
      {% if post.coming_soon %}
        <span class="coming-soon-post">{{ post.title }}</span>
        <small class="coming-soon-label">coming soon</small>
      {% else %}
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <small>{{ post.date | date: "%Y-%m-%d" }}</small>
      {% endif %}
      {% if post.preview and post.preview != "" %}
        <br><small class="post-preview">{{ post.preview }}</small>
      {% endif %}
    </li>
  {% endfor %}
</ul>
