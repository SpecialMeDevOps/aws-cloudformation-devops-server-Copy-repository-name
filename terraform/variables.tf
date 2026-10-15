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
  description = "Project prefix for CloudFormation stacks."
  type        = string
  default     = "it-your-it-house"
}

variable "deploy_application" {
  description = "Create or update the application CloudFormation stack after immutable image publication."
  type        = bool
  default     = false
}

variable "frontend_image_uri" {
  description = "Frontend ECR image URI using an immutable commit tag."
  type        = string
  default     = ""
  validation {
    condition     = !var.deploy_application || can(regex(".+@sha256:[a-f0-9]{64}", var.frontend_image_uri))
    error_message = "Application deployment requires a frontend ECR image URI pinned to a SHA256 digest."
  }
}

variable "backend_image_uri" {
  description = "Backend ECR image URI using an immutable commit tag."
  type        = string
  default     = ""
  validation {
    condition     = !var.deploy_application || can(regex(".+@sha256:[a-f0-9]{64}", var.backend_image_uri))
    error_message = "Application deployment requires a backend ECR image URI pinned to a SHA256 digest."
  }
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN in the deployment region."
  type        = string
  default     = ""
  validation {
    condition     = !var.deploy_application || length(trimspace(var.certificate_arn)) > 0
    error_message = "Application deployment requires an ACM certificate ARN so the ALB uses HTTPS."
  }
}

variable "allowed_web_ingress_cidr" {
  description = "CIDR allowed to access the public application load balancer."
  type        = string
  default     = "0.0.0.0/0"
  validation {
    condition     = !var.deploy_application || (can(cidrhost(var.allowed_web_ingress_cidr, 0)) && var.allowed_web_ingress_cidr != "0.0.0.0/0")
    error_message = "Application deployment requires a valid, narrowly allowlisted ALB CIDR instead of 0.0.0.0/0."
  }
}

variable "db_instance_class" {
  description = "RDS PostgreSQL instance class; review cost and availability before applying."
  type        = string
  default     = "db.t4g.micro"
}

variable "service_desired_count" {
  description = "Desired count for ECS services; deployment workflow sets zero until the approved Prisma migration completes."
  type        = number
  default     = 1
  validation {
    condition     = var.service_desired_count >= 0 && var.service_desired_count <= 2
    error_message = "service_desired_count must be between 0 and 2."
  }
}

variable "s3_managed_prefix_list_id" {
  description = "AWS-managed regional S3 prefix list ID used to restrict ECR layer download egress."
  type        = string
  default     = ""
  validation {
    condition     = !var.deploy_application || can(regex("^pl-[0-9a-f]+$", var.s3_managed_prefix_list_id))
    error_message = "Application deployment requires the AWS-managed S3 prefix list ID for the selected region."
  }
}

variable "monitoring_instance_role_name" {
  description = "Optional existing Jenkins EC2 role to receive scoped read-only ECS/CloudWatch monitoring permissions."
  type        = string
  default     = ""
  validation {
    condition     = !var.deploy_application || length(trimspace(var.monitoring_instance_role_name)) > 0
    error_message = "Application deployment requires the existing Jenkins instance-profile role name for monitoring verification."
  }
}
