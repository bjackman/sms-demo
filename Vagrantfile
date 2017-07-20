# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/xenial64"

  config.vm.network "forwarded_port", guest: 8080, host: 8080, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 3000, host: 3000, host_ip: "127.0.0.1"


  config.vm.provision "shell", inline: <<-SHELL
    curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
    chmod +x ./nodesource_setup.sh
    ./nodesource_setup.sh
    apt-get install -y nodejs

    apt-get install -y python
    gcloud_sdk=google-cloud-sdk-163.0.0-linux-x86_64
    wget https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/${gcloud_sdk}.tar.gz
    tar -xzf ${gcloud_sdk}.tar.gz
    google-cloud-sdk/install.sh -q
    echo "source /home/ubuntu/google-cloud-sdk/completion.bash.inc" >> ~ubuntu/.profile
    echo "source /home/ubuntu/google-cloud-sdk/path.bash.inc" >> ~ubuntu/.profile
  SHELL
end
