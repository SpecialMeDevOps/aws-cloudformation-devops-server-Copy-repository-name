Trivy secret scan findings (secret values are intentionally omitted)
{{- range . }}
{{- range .Secrets }}
{{ .Severity }} | {{ .RuleID }} | {{ .Target }}:{{ .StartLine }} | {{ .Title }}
{{- end }}
{{- end }}
