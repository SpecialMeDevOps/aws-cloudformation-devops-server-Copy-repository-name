variable "aws_region" {
  description = "AWS region for the deployment environment."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used as a prefix for created resources."
  type        = string
  default     = "it-your-it-house"
}
