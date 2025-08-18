source "https://rubygems.org"

ruby "~> 3.1"              # optional, keeps CI/local consistent
gem "jekyll", "~> 4.4"
gem "jekyll-bear-theme"    # <-- theme goes here (NOT in :jekyll_plugins)
gem "webrick", "~> 1.8"    # for `jekyll serve` on ruby 3 (harmless in CI)

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
end
