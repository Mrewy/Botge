package docker

# METADATA
# description: Allows local Dockerfile sources and the pinned Docker Hardened Image base.
# scope: rule
default allow := false

allow if input.local

allow if {
	input.image.fullRepo == "dhi.io/node"
	input.image.isCanonical
}

# METADATA
# description: Reports whether the Dockerfile source and its base image satisfy the policy.
# scope: rule
decision := {"allow": allow}
