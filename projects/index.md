---
layout: default
title: Projects
---

<h1>projects</h1>
<p>some tools/games i am making for fun - this will be continuously updated!</p>

{% assign items = site.projects | sort: 'date' | reverse %}
{% for p in items %}
  {% include project_item.html project=p %}
{% endfor %}
