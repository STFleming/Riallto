# Copyright (C) 2023 Advanced Micro Devices, Inc. All rights reserved.
# SPDX-License-Identifier: MIT

"""This setup.py file is used to build the IPU Python package for the
Riallto project. It installs Python APIs for developers to build and 
program the AMD IPU device. This package also includes a set of prebuilt
computer vision applications that can be used to run on the IPU.

Note
----
You can run prebuilt applications out of the box using this IPU Python
package, however in order to build your own applications you will need
to install Riallto using the full installer and additionally obtain
an AIEBuild license from https://www.xilinx.com/getlicense.
"""

from setuptools import find_packages, setup
from pathlib import Path

def attempt_download(url:str, path:Path)->None:
    """" Attempts to download a file and place it in the path. Stops siliently if it is not able to """
    import urllib.request
    try:
        opener = urllib.request.build_opener()
        opener.addheaders = [(('User-Agent', 'Mozilla/5.0'))]
        urllib.request.install_opener(opener)
        urllib.request.urlretrieve(url, path)
    except:
        pass

attempt_download(url='https://d3js.org/d3.v7.min.js', path=Path('npu/runtime/tracer/visualisations/libs/d3.v7.min.js'))

setup(
    name="npu",
    version='1.0',
    package_data={
        '': ['*.py', '*.pyd', '*.so', '*.dll', 'Makefile', '.h', '.cpp',
            'tests/*',
	    'runtime/*.so',
            'runtime/*.dll',
            'runtime/tracer/visualisations/libs/*.js',
            'build/*.txt',
            'utils/*',
            'lib/applications/*',
            'lib/kernels/*',
            'lib/graphs/*',
            'lib/kernels/cpp/*.cpp',
            'lib/kernels/cpp/*.h',
            'runtime/utils/*',
            'build_template/check_license.sh',
            'build_template/kernel_build.sh',
            'build_template/seq_build.sh',
            'build_template/app_build.sh',
            'lib/applications/binaries/*'],
    },
    packages=find_packages(),
    python_requires="==3.9.*",
    install_requires=[
        "numpy",
        "pytest",
        "pytest-cov",
        "opencv-python",
        "matplotlib",
        "CppHeaderParser",
        "jupyterlab",
        "ipywidgets",
        "pillow>=10.0.0"
    ],
    description="Riallto is a simple framework for programming and interacting with the AMD IPU device.")
