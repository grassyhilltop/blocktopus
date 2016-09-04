#include "octoset.h"
#include "ui_octoset.h"



//Defines



octoSet::octoSet(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::octoSet)
{
    ui->setupUi(this);
}

octoSet::~octoSet()
{
    delete ui;
}

void octoSet::on_dig_in_pressed(){
    QProcess py_process;
    py_process.start("../py/set_digital_input.py");
    py_process.waitForFinished();
}

void octoSet::on_dig_out_pressed(){
    QProcess py_process;
    py_process.start("../py/set_digital_output.py");
    py_process.waitForFinished();

}

void octoSet::on_ana_in_pressed(){
    QProcess py_process;
    py_process.start("../py/set_analog_input.py");
    py_process.waitForFinished();
}

void octoSet::on_ana_out_released(){
    QProcess py_process;
    py_process.start("../py/set_analog_output.py");
    py_process.waitForFinished();
}


void startProcess(std::string processName){
//    QProcess py_process;
//    py_process.start(processName);
//    py_process.waitForFinished();
}

