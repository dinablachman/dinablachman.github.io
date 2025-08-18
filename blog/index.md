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
    </li>
  {% endfor %}
</ul>

<style>
.coming-soon-post {
  color: #666;
  font-style: italic;
  cursor: default;
}

.coming-soon-label {
  background-color: #f0f0f0;
  color: #666;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
  margin-left: 8px;
}
</style>
