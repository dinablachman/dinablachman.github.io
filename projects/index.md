---
layout: default
title: Projects
---

<h1>projects</h1>

{% assign items = site.projects | sort: 'date' | reverse %}
{% for p in items %}
  {% include project_item.html project=p %}
{% endfor %}
