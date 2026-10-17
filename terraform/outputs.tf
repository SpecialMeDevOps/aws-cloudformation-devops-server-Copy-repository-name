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

output "cluster_name" {
  description = "EKS cluster name from CloudFormation, null until application deployment."
  value       = var.deploy_application ? aws_cloudformation_stack.application[0].outputs["ClusterName"] : null
}

output "application_namespace" {
  description = "Kubernetes namespace containing the application workloads."
  value       = var.deploy_application ? aws_cloudformation_stack.application[0].outputs["ApplicationNamespace"] : null
}
