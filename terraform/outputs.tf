output "registry_stack_name" {
  description = "CloudFormation stack name that owns the ECR repositories."
  value       = aws_cloudformation_stack.registry.name
}

output "frontend_repository_uri" {
  description = "Frontend ECR URI from CloudFormation outputs."
  value       = aws_cloudformation_stack.registry.outputs["FrontendRepositoryUri"]
}

output "backend_repository_uri" {
  description = "Backend ECR URI from CloudFormation outputs."
  value       = aws_cloudformation_stack.registry.outputs["BackendRepositoryUri"]
}

output "application_outputs" {
  description = "CloudFormation outputs for the application stack, empty before application deployment."
  value       = var.deploy_application ? aws_cloudformation_stack.application[0].outputs : {}
}

output "monitoring_outputs" {
  description = "CloudFormation outputs for the monitoring stack, empty before monitoring deployment."
  value       = var.deploy_application ? aws_cloudformation_stack.monitoring[0].outputs : {}
}

output "application_url" {
  description = "CloudFront default HTTPS URL, null until application deployment."
  value       = var.deploy_application ? aws_cloudformation_stack.application[0].outputs["ApplicationUrl"] : null
}

output "cluster_name" {
  description = "ECS cluster name from CloudFormation, null until application deployment."
  value       = var.deploy_application ? aws_cloudformation_stack.application[0].outputs["ClusterName"] : null
}

output "frontend_service_name" {
  description = "Frontend ECS service name from CloudFormation, null until application deployment."
  value       = var.deploy_application ? aws_cloudformation_stack.application[0].outputs["FrontendServiceName"] : null
}

output "backend_service_name" {
  description = "Backend ECS service name from CloudFormation, null until application deployment."
  value       = var.deploy_application ? aws_cloudformation_stack.application[0].outputs["BackendServiceName"] : null
}
