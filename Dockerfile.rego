package docker

# METADATA
# description: Allows local, Botge, Docker Node Hardened Image and Docker images.
# scope: rule
default allow := false

allow if input.local

allow if {
	input.git.host == "github.com"
	input.git.remote == "https://github.com/MrewyOrg/Botge.git"
	input.git.branch == "main"
}

allow if {
	input.image.fullRepo == "dhi.io/node"
	input.image.isCanonical
}

allow if {
	input.image.host == "docker.io"
	input.image.repo == "docker"
}

# METADATA
# description: Reports whether the Dockerfile source and its base image satisfy the policy.
# scope: rule
decision := {"allow": allow}
