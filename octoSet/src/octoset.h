#ifndef OCTOSET_H
#define OCTOSET_H



#include <QMainWindow>
#include <QProcess>


namespace Ui {
class octoSet;
}

class octoSet : public QMainWindow
{
    Q_OBJECT

public:
    explicit octoSet(QWidget *parent = 0);
    ~octoSet();

private slots:
    void on_dig_in_pressed();
    void on_dig_out_pressed();
    void on_ana_in_pressed();
    void on_ana_out_released();

private:
    Ui::octoSet *ui;


    //methods
    void startProcess(std::string processName);



};

#endif // OCTOSET_H
